sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    AppUtils,
    ODataReadError,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.attendance.List', {
      TableUtils: TableUtils,

      PAGE_TYPE: { NEW: 'A', CHANGE: 'B', CANCEL: 'C' },

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          isVisibleActionButton: false,
          quota: {
            10: { Kotxt: this.getBundleText('LABEL_04015'), Crecnt: 0, Usecnt: 0 }, // 연차
            20: { Kotxt: this.getBundleText('LABEL_04016'), Crecnt: 0, Usecnt: 0 }, // 1년미만연차
            30: { Kotxt: this.getBundleText('LABEL_04017'), Crecnt: 0, Usecnt: 0 }, // 장기근속휴가
            40: { Kotxt: this.getBundleText('LABEL_04017'), Crecnt: 0, Usecnt: 0 }, // 장기근속휴가
            50: { Kotxt: this.getBundleText('LABEL_04008'), Crecnt: 0, Usecnt: 0 }, // 보건휴가
            60: { Kotxt: this.getBundleText('LABEL_04018'), Crecnt: 0, Usecnt: 0 }, // 가족돌봄휴가
          },
          search: {
            Apbeg: moment().subtract(1, 'month').add(1, 'day').hours(9).toDate(),
            Apend: moment().hours(9).toDate(),
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            isShowProgress: false,
            progressCount: 0,
            isShowApply: true,
            applyCount: 0,
            isShowApprove: true,
            approveCount: 0,
            isShowReject: true,
            rejectCount: 0,
            isShowComplete: true,
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
        const sPernr = this.getSessionProperty('Pernr');
        const oSearchConditions = oViewModel.getProperty('/search');
        const mQuota = oViewModel.getProperty('/quota');

        try {
          oViewModel.setProperty('/busy', true);

          const [aQuotaResultData, aRowData] = await Promise.all([
            this.readAbsQuotaList({ oModel, sPernr }), //
            this.readLeaveApplContent({ oModel, oSearchConditions }),
          ]);

          this.setTableData({ oViewModel, aRowData });

          const mQuotaResult = _.reduce(
            aQuotaResultData,
            (acc, { Ktart, Kotxt, Crecnt, Usecnt }) => ({
              ...acc,
              [Ktart]: {
                Kotxt,
                Crecnt: parseInt(Crecnt, 10) ?? 0,
                Usecnt: parseInt(Usecnt, 10) ?? 0,
                Balcnt: parseInt(Balcnt, 10) ?? 0,
              },
            }),
            {}
          );

          oViewModel.setProperty('/quota', { ...mQuota, ...mQuotaResult });
        } catch (oError) {
          this.debug('Controller > Attendance List > initialRetrieve Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aRowData }) {
        const oTable = this.byId('attendanceTable');
        const oListInfo = oViewModel.getProperty('/listInfo');

        oViewModel.setProperty(
          '/list',
          aRowData.map((o) => {
            return {
              ...o,
              BegdaTxt: o.Begda ? moment(new Date(o.Begda)).hours(9).format('YYYY.MM.DD') : '',
              EnddaTxt: o.Endda ? moment(new Date(o.Endda)).hours(9).format('YYYY.MM.DD') : '',
              AppdtTxt: o.Appdt ? moment(new Date(o.Appdt)).hours(9).format('YYYY.MM.DD') : '',
              SgndtTxt: o.Sgndt ? moment(new Date(o.Sgndt)).hours(9).format('YYYY.MM.DD') : '',
            };
          })
        );
        oViewModel.setProperty('/listInfo', { ...oListInfo, ...TableUtils.count({ oTable, aRowData }) });
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressSearch() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const oSearchConditions = oViewModel.getProperty('/search');

        try {
          oViewModel.setProperty('/busy', true);

          const aRowData = await this.readLeaveApplContent({ oModel, oSearchConditions });

          this.setTableData({ oViewModel, aRowData });
        } catch (oError) {
          this.debug('Controller > Attendance List > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onPressExcelDownload() {
        const oTable = this.byId('attendanceTable');
        const aTableData = this.getViewModel().getProperty('/list');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_04001'); // {근태신청}_목록

        TableUtils.export({ oTable, aTableData, sFileName });
      },

      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(sPath);

        oViewModel.setProperty('/parameter/rowData', [oRowData]);
        this.getRouter().navTo('attendance-detail', { type: oRowData.Appty, appno: oRowData.Appno });
      },

      onChangeRowSelection(oEvent) {
        const oTable = oEvent.getSource();
        const oViewModel = this.getViewModel();
        const aSelectedIndices = oTable.getSelectedIndices();

        oViewModel.setProperty('/parameter/rowData', []);
        oViewModel.setProperty('/parameter/selectedIndices', aSelectedIndices);

        if (!aSelectedIndices.length) {
          oViewModel.setProperty('/isVisibleActionButton', false);
        } else {
          oViewModel.setProperty(
            '/isVisibleActionButton',
            !aSelectedIndices.some((idx) => {
              const oRowData = oViewModel.getProperty(`/list/${idx}`);

              return oRowData.Appty !== this.PAGE_TYPE.NEW || oRowData.ZappStatAl !== '20';
            })
          );
        }
      },

      setRowActionParameters() {
        const oViewModel = this.getViewModel();
        const aSelectedIndices = oViewModel.getProperty('/parameter/selectedIndices');

        oViewModel.setProperty(
          '/parameter/rowData',
          aSelectedIndices.map((idx) => {
            const oRowData = oViewModel.getProperty(`/list/${idx}`);

            return oRowData;
          })
        );
      },

      onPressNewApprovalBtn() {
        this.getRouter().navTo('attendance-detail', { type: this.PAGE_TYPE.NEW });
      },

      onPressModApprovalBtn() {
        this.setRowActionParameters();
        this.getRouter().navTo('attendance-detail', { type: this.PAGE_TYPE.CHANGE });
      },

      onPressCancApprovalBtn() {
        this.setRowActionParameters();
        this.getRouter().navTo('attendance-detail', { type: this.PAGE_TYPE.CANCEL });
      },

      onSuggest(oEvent) {
        const oModel = this.getModel(ServiceNames.COMMON);
        const oControl = oEvent.getSource();
        const sValue = oEvent.getParameter('suggestValue');

        oControl.destroySuggestionItems();

        oModel.read('/EmpSearchResultSet', {
          filters: [
            new Filter('Persa', FilterOperator.EQ, '1000'), //
            new Filter('Short', FilterOperator.EQ, 'X'),
            new Filter('Ename', FilterOperator.EQ, sValue),
          ],
          success: (oData) => {
            oData.results.forEach((o) => {
              oControl.addSuggestionItem(new sap.ui.core.ListItem({ text: o.Ename, additionalText: o.Fulln, key: o.Pernr }));
            });
          },
          error: (oError) => {
            this.debug(oError);
          },
        });
      },

      onSelectSuggest(oEvent) {
        const oControl = oEvent.getSource();
        this.debug(oControl);
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
      /**
       * @param  {JSONModel} oModel
       * @param  {String} sPernr
       */
      readAbsQuotaList({ oModel, sPernr }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/AbsQuotaListSet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Pernr', FilterOperator.EQ, sPernr), //
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      /**
       * @param  {JSONModel} oModel
       * @param  {Object} oSearchConditions
       */
      readLeaveApplContent({ oModel, oSearchConditions }) {
        const sUrl = '/LeaveApplContentSet';
        const sMenid = this.getCurrentMenuId();

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            filters: [
              new Filter('Menid', FilterOperator.EQ, sMenid), //
              new Filter('Apbeg', FilterOperator.EQ, moment(oSearchConditions.Apbeg).hours(9).toDate()),
              new Filter('Apend', FilterOperator.EQ, moment(oSearchConditions.Apend).hours(9).toDate()),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },
    });
  }
);
