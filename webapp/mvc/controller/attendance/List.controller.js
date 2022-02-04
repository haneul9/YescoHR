sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    DateUtils,
    Client,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.attendance.List', {
      TableUtils: TableUtils,

      PAGE_TYPE: { NEW: 'A', CHANGE: 'B', CANCEL: 'C' },

      onInit() {
        BaseController.prototype.onInit.apply(this, arguments);

        const oViewModel = new JSONModel({
          busy: false,
          isVisibleActionButton: false,
          quota: {
            10: { Kotxt: this.getBundleText('LABEL_04015'), Crecnt: 0, Usecnt: 0 }, // 연차
            20: { Kotxt: this.getBundleText('LABEL_04016'), Crecnt: 0, Usecnt: 0 }, // 1년미만연차
            30: { Kotxt: this.getBundleText('LABEL_04007'), Crecnt: 0, Usecnt: 0 }, // 하계휴가
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

      // onBeforeShow() {},

      async onObjectMatched() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const sPernr = this.getSessionProperty('Pernr');
        const oSearchConditions = oViewModel.getProperty('/search');
        const mQuota = oViewModel.getProperty('/quota');

        try {
          oViewModel.setProperty('/busy', true);

          const fCurriedGetEntitySet = Client.getEntitySet(oModel);
          const [aQuotaResultData, aRowData] = await Promise.all([
            fCurriedGetEntitySet('AbsQuotaList', { Menid: this.getCurrentMenuId(), Pernr: sPernr }), //
            fCurriedGetEntitySet('LeaveApplContent', { Menid: this.getCurrentMenuId(), Apbeg: DateUtils.parse(oSearchConditions.Apbeg), Apend: DateUtils.parse(oSearchConditions.Apend) }),
          ]);

          this.setTableData({ oViewModel, aRowData });

          const mQuotaResult = _.reduce(
            aQuotaResultData,
            (acc, { Ktart, Kotxt, Crecnt, Usecnt, Balcnt }) => ({
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

        oViewModel.setProperty('/list', aRowData);
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

          const aRowData = await Client.getEntitySet(oModel, 'LeaveApplContent', { Menid: this.getCurrentMenuId(), Apbeg: DateUtils.parse(oSearchConditions.Apbeg), Apend: DateUtils.parse(oSearchConditions.Apend) });

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
        const aDateProps = ['Begda', 'Endda', 'Appdt', 'Sgndt'];

        TableUtils.export({ oTable, aTableData, sFileName, aDateProps });
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

              return oRowData.Appty !== this.PAGE_TYPE.NEW || oRowData.ZappStatAl !== '60';
            })
          );
        }
      },

      setRowActionParameters() {
        const oViewModel = this.getViewModel();
        const aSelectedIndices = oViewModel.getProperty('/parameter/selectedIndices');

        oViewModel.setProperty(
          '/parameter/rowData',
          aSelectedIndices.map((idx) => oViewModel.getProperty(`/list/${idx}`))
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

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
