sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AttachFileAction,
    EmpInfo,
    TableUtils,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.nightduty.List', {
      constructor: function () {
        this.AttachFileAction = AttachFileAction;
        this.TableUtils = TableUtils;
        this.TYPE_CODE = 'HR01';
      },

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          isVisibleActionButton: false,
          quota: {},
          search: {
            Apbeg: moment().subtract(1, 'month').add(1, 'day').hours(9).toDate(),
            Apend: moment().hours(9).toDate(),
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
          list: [],
          parameter: {
            selectedIndices: [],
            rowData: [],
          },
        });
        this.setViewModel(oViewModel);
      },

      async onObjectMatched() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const sPernr = this.getOwnerComponent().getSessionModel().getProperty('/Pernr');
        const oSearchConditions = oViewModel.getProperty('/search');

        try {
          oViewModel.setProperty('/busy', true);

          const [mQuotaResultData, mRowData] = await Promise.all([
            this.readAbsQuotaList({ oModel, sPernr }), //
            this.readLeaveApplContent({ oModel, oSearchConditions }),
          ]);

          setTimeout(() => {
            this.setTableData({ oViewModel, mRowData });
          }, 100);
          // throw new Error('Oops!!');
          oViewModel.setProperty(
            '/quota',
            _.reduce(
              mQuotaResultData,
              (acc, { Ktart, Kotxt, Crecnt, Usecnt }) => ({
                ...acc,
                [Ktart]: {
                  Kotxt,
                  Crecnt: parseInt(Crecnt, 10),
                  Usecnt: parseInt(Usecnt, 10),
                  Rate: (parseInt(Usecnt, 10) / parseInt(Crecnt, 10)) * 100,
                },
              }),
              {}
            )
          );
        } catch (oError) {
          this.debug('Controller > Attendance List > initialRetrieve Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, mRowData }) {
        const oTable = this.byId('attendanceTable');

        oViewModel.setProperty(
          '/list',
          mRowData.map((o) => {
            return {
              ...o,
              Pernr: parseInt(o.Pernr, 10),
              BegdaTxt: o.Begda ? moment(new Date(o.Begda)).hours(9).format('YYYY.MM.DD') : '',
              EnddaTxt: o.Endda ? moment(new Date(o.Endda)).hours(9).format('YYYY.MM.DD') : '',
              AppdtTxt: o.Appdt ? moment(new Date(o.Appdt)).hours(9).format('YYYY.MM.DD') : '',
              SgndtTxt: o.Sgndt ? moment(new Date(o.Sgndt)).hours(9).format('YYYY.MM.DD') : '',
            };
          })
        );
        oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, mRowData }));
      },

      onClick() {
        this.getRouter().navTo('congratulation-detail', { oDataKey: 'N' });
      },

      onExelDownload() {
        const oTable = this.byId('conguTable');
        const mTableData = this.getViewModel().getProperty('/CongList');
        const sFileName = '경조금신청_목록';

        TableUtils.export({ oTable, mTableData, sFileName });
      },

      formatNumber(vNum) {
        if (!vNum || vNum === '') return '0';

        return vNum;
      },

      formatPay(vPay) {
        if (!vPay || vPay === '0') return '0';

        return `${vPay}만원`;
      },

      getTotalPay() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oTotalModel = this.getViewModel();

        oModel.read('/ConExpenseMyconSet', {
          success: function (oData) {
            if (oData) {
              // Common.log(oData);
              const oTotal = oData.results[0];

              oTotalModel.setProperty('/Total', oTotal);
            }
          },
          error: function (oRespnse) {
            // Common.log(oResponse);
          },
        });
      },

      onSearch() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oSearchDate = this.byId('SearchDate');
        const oListModel = this.getViewModel();
        const oController = this;
        const dDate = moment(oSearchDate.getDateValue()).hours(10).toDate();
        const dDate2 = moment(oSearchDate.getSecondDateValue()).hours(10).toDate();

        oListModel.setProperty('/busy', true);

        oModel.read('/ConExpenseApplSet', {
          filters: [
            new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'L'),
            new sap.ui.model.Filter('Actty', sap.ui.model.FilterOperator.EQ, 'E'),
            new sap.ui.model.Filter('Apbeg', sap.ui.model.FilterOperator.EQ, dDate),
            new sap.ui.model.Filter('Apend', sap.ui.model.FilterOperator.EQ, dDate2),
          ],
          success: function (oData) {
            if (oData) {
              // Common.log(oData);
              const oList = oData.results.map((o) => {
                return {
                  ...o,
                  Pernr: parseInt(o.Pernr, 10),
                };
              });
              // let vNo = 0;

              // oList.forEach((e) => {
              //   vNo = vNo + 1;
              //   e.No = vNo;
              // });

              TableUtils.count.call(oController, oList);
              oListModel.setProperty('/CongList', oList);
              oController.byId('conguTable').setVisibleRowCount(oList.length);
              oListModel.setProperty('/busy', false);
            }
          },
          error: function (oRespnse) {
            // Common.log(oResponse);
            oListModel.setProperty('/busy', false);
          },
        });
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo('congratulation-detail', { oDataKey: oRowData.Appno });
        // this.getRouter().getTargets().display('congDetail', { oDataKey: oRowData.Appno });
      },
    });
  }
);
