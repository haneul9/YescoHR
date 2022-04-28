sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FileListDialogHandler',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    FileListDialogHandler,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.congratulation.Congratulation', {
      FileListDialogHandler: null,

      initializeModel() {
        return {
          busy: false,
          Data: [],
          routeName: '',
          searchDate: {
            date: moment().hours(9).toDate(),
            secondDate: moment().subtract(1, 'month').add(1, 'day').hours(9).toDate(),
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
        };
      },

      onBeforeShow() {
        this.FileListDialogHandler = new FileListDialogHandler(this);
      },

      onObjectMatched(oParameter, sRouteName) {
        this.getViewModel().setProperty('/routeName', sRouteName);
        this.onSearch();
        this.getTotalPay();
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR01';
      },

      // 대상자 정보 사원선택시 화면 Refresh
      callbackAppointeeChange() {
        this.onSearch();
        this.getTotalPay();
      },

      onClick() {
        this.getRouter().navTo(`${this.getViewModel().getProperty('/routeName')}-detail`, { oDataKey: 'N' });
      },

      formatNumber(vNum) {
        if (!vNum || vNum === '') return '0';

        return vNum;
      },

      formatPay(vPay) {
        if (!vPay || vPay === '0') return '0';

        return vPay;
      },

      // 나의 경조금
      async getTotalPay() {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const [oTotal] = await Client.getEntitySet(oModel, 'ConExpenseMycon', { Pernr: this.getAppointeeProperty('Pernr') });

          oViewModel.setProperty('/Total', oTotal);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 경조금 내역조회
      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.BENEFIT);
          const oSearchDate = oViewModel.getProperty('/searchDate');
          const dDate = moment(oSearchDate.secondDate).hours(9).toDate();
          const dDate2 = moment(oSearchDate.date).hours(9).toDate();
          const sMenid = this.getCurrentMenuId();
          const mPayLoad = {
            Pernr: this.getAppointeeProperty('Pernr'),
            Prcty: 'L',
            Menid: sMenid,
            Apbeg: dDate,
            Apend: dDate2,
          };

          const aTableList = await Client.getEntitySet(oModel, 'ConExpenseAppl', mPayLoad);
          const oTable = this.byId('conguTable');

          oViewModel.setProperty('/CongList', aTableList);
          oViewModel.setProperty('/listInfo', this.TableUtils.count({ oTable, aRowData: aTableList }));
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onSelectRow(oEvent) {
        const oListModel = this.getViewModel();
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oRowData = this.getViewModel().getProperty(vPath);
        const sRouteName = oListModel.getProperty('/routeName');

        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: oRowData.Appno });
      },

      onPressExcelDownload() {
        const oTable = this.byId('conguTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_02022');

        this.TableUtils.export({ oTable, sFileName });
      },

      onPressFileListDialogOpen(oEvent) {
        this.FileListDialogHandler.openDialog(oEvent);
      },
    });
  }
);
