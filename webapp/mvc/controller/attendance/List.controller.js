sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/EmployeeSearch',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
    'sap/ui/yesco/mvc/model/type/Decimal',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    EmployeeSearch,
    DateUtils,
    Client,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.attendance.List', {
      TableUtils: TableUtils,
      EmployeeSearch: EmployeeSearch,

      PAGE_TYPE: { NEW: 'A', CHANGE: 'B', CANCEL: 'C' },

      initializeModel() {
        return {
          busy: false,
          routeName: '',
          quota: {
            isSecondVisible: false,
            10: { Kotxt: this.getBundleText('LABEL_04015'), Crecnt: 0, Usecnt: 0 }, // 연차쿼터
            15: { Kotxt: this.getBundleText('LABEL_04019'), Crecnt: 0, Usecnt: 0 }, // 연차(1년미만)쿼터
            20: { Kotxt: this.getBundleText('LABEL_04016'), Crecnt: 0, Usecnt: 0 }, // 하계휴가쿼터
            30: { Kotxt: this.getBundleText('LABEL_04008'), Crecnt: 0, Usecnt: 0 }, // 보건휴가
            40: { Kotxt: this.getBundleText('LABEL_04017'), Crecnt: 0, Usecnt: 0 }, // 장기근속휴가
            50: { Kotxt: this.getBundleText('LABEL_04018'), Crecnt: 0, Usecnt: 0 }, // 가족돌봄휴가
          },
          search: {
            Apbeg: moment().startOf('year').hours(9).toDate(),
            Apend: moment().endOf('year').hours(9).toDate(),
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
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const sPernr = this.getAppointeeProperty('Pernr');
        const oSearchConditions = oViewModel.getProperty('/search');
        const mQuota = oViewModel.getProperty('/quota');

        try {
          oViewModel.setProperty('/busy', true);
          oViewModel.setProperty('/routeName', sRouteName);
          this.getAppointeeModel().setProperty('/showChangeButton', true);

          const fCurriedGetEntitySet = Client.getEntitySet(oModel);
          const [aQuotaResultData, aRowData] = await Promise.all([
            fCurriedGetEntitySet('AbsQuotaList', { Menid: this.getCurrentMenuId(), Pernr: sPernr }), //
            fCurriedGetEntitySet('LeaveApplContent', {
              Menid: this.getCurrentMenuId(),
              Pernr: sPernr,
              Apbeg: DateUtils.parse(oSearchConditions.Apbeg),
              Apend: DateUtils.parse(oSearchConditions.Apend),
            }),
          ]);

          this.setTableData({ oViewModel, aRowData });

          const mQuotaResult = _.reduce(
            aQuotaResultData,
            (acc, { Ktart, Kotxt, Crecnt, Usecnt, Balcnt }) => ({
              ...acc,
              [Ktart]: {
                Kotxt,
                Crecnt: _.toNumber(Crecnt) ?? 0,
                Usecnt: _.toNumber(Usecnt) ?? 0,
                Balcnt: _.toNumber(Balcnt) ?? 0,
              },
            }),
            {}
          );

          oViewModel.setProperty('/quota', { ...mQuota, ...mQuotaResult, isSecondVisible: _.isEqual(this.getAppointeeProperty('Werks'), '2000') });
        } catch (oError) {
          this.debug('Controller > Attendance List > initialRetrieve Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async callbackAppointeeChange() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const oSearchConditions = oViewModel.getProperty('/search');
          const sPernr = this.getAppointeeProperty('Pernr');
          const fCurriedGetEntitySet = Client.getEntitySet(this.getModel(ServiceNames.WORKTIME));
          const [aQuotaResultData, aRowData] = await Promise.all([
            fCurriedGetEntitySet('AbsQuotaList', { Menid: this.getCurrentMenuId(), Pernr: sPernr }), //
            fCurriedGetEntitySet('LeaveApplContent', {
              Menid: this.getCurrentMenuId(),
              Pernr: sPernr,
              Apbeg: DateUtils.parse(oSearchConditions.Apbeg),
              Apend: DateUtils.parse(oSearchConditions.Apend),
            }),
          ]);

          this.setTableData({ oViewModel, aRowData });

          const mQuotaResult = _.reduce(
            aQuotaResultData,
            (acc, { Ktart, Kotxt, Crecnt, Usecnt, Balcnt }) => ({
              ...acc,
              [Ktart]: {
                Kotxt,
                Crecnt: _.toNumber(Crecnt) ?? 0,
                Usecnt: _.toNumber(Usecnt) ?? 0,
                Balcnt: _.toNumber(Balcnt) ?? 0,
              },
            }),
            {}
          );

          oViewModel.setProperty('/quota', {
            ...{
              isSecondVisible: false,
              10: { Kotxt: this.getBundleText('LABEL_04015'), Crecnt: 0, Usecnt: 0 }, // 연차쿼터
              15: { Kotxt: this.getBundleText('LABEL_04019'), Crecnt: 0, Usecnt: 0 }, // 연차(1년미만)쿼터
              20: { Kotxt: this.getBundleText('LABEL_04016'), Crecnt: 0, Usecnt: 0 }, // 하계휴가쿼터
              30: { Kotxt: this.getBundleText('LABEL_04008'), Crecnt: 0, Usecnt: 0 }, // 보건휴가
              40: { Kotxt: this.getBundleText('LABEL_04017'), Crecnt: 0, Usecnt: 0 }, // 장기근속휴가
              50: { Kotxt: this.getBundleText('LABEL_04018'), Crecnt: 0, Usecnt: 0 }, // 가족돌봄휴가
            },
            ...mQuotaResult,
            isSecondVisible: _.isEqual(this.getAppointeeProperty('Werks'), '2000'),
          });
        } catch (oError) {
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

          const aRowData = await Client.getEntitySet(oModel, 'LeaveApplContent', {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Apbeg: DateUtils.parse(oSearchConditions.Apbeg),
            Apend: DateUtils.parse(oSearchConditions.Apend),
          });

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
        const oRowData = oViewModel.getProperty(sPath);
        const sRouteName = oViewModel.getProperty('/routeName');

        oViewModel.setProperty('/parameter/rowData', [oRowData]);
        this.getRouter().navTo(`${sRouteName}-detail`, { type: oRowData.Appty, appno: _.isEqual(oRowData.Appno, '00000000000000') ? 'NA' : oRowData.Appno });
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
        const sRouteName = this.getViewModel().getProperty('/routeName');

        this.getRouter().navTo(`${sRouteName}-detail`, { type: this.PAGE_TYPE.NEW });
      },

      onPressModApprovalBtn() {
        const sRouteName = this.getViewModel().getProperty('/routeName');

        this.setRowActionParameters();
        this.getRouter().navTo(`${sRouteName}-detail`, { type: this.PAGE_TYPE.CHANGE });
      },

      onPressCancApprovalBtn() {
        const sRouteName = this.getViewModel().getProperty('/routeName');

        this.setRowActionParameters();
        this.getRouter().navTo(`${sRouteName}-detail`, { type: this.PAGE_TYPE.CANCEL });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
