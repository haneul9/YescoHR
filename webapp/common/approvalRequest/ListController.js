sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FileDataProvider',
    'sap/ui/yesco/common/FileListDialogHandler',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    FileDataProvider,
    FileListDialogHandler,
    BaseController
  ) => {
    'use strict';

    /**
     * class 실사용은 nightduty, leavOfAbsence 참고할 것
     */
    return BaseController.extend('sap.ui.yesco.common.approvalRequest.ListController', {
      sRouteName: '',
      oOverviewBoxHandler: null, // Overview box handler
      oSearchBoxHandler: null, // Search box handler

      initializeModel() {
        return {};
      },

      /**
       * onObjectMatched의 신청 목록 버전 function
       * 필요시 overriding 해서 사용할 것
       * @param {object} mParameter
       * @param {string} sRouteName
       */
      async onObjectMatchedForRequestList(mParameter, sRouteName) {
        try {
          this.sRouteName = sRouteName;

          this.oOverviewBoxHandler = this.oOverviewBoxHandler || this.getOverviewBoxHandler();
          this.oSearchBoxHandler = this.oSearchBoxHandler || this.getSearchBoxHandler();
          if (this.useFileListDialog()) {
            this.oFileListDialogHandler = this.oFileListDialogHandler || this.getFileListDialogHandler();
          }

          this.onPressSearch();
        } catch (oError) {
          this.debug('common.approvalRequest.ListController > onObjectMatchedForRequestList', oError);

          AppUtils.handleError(oError);
        }
      },

      /**
       * 신청 목록 table id 반환 (Default : approvalRequestListTable)
       * default 값을 사용하지 않을 경우 overriding 할 것
       */
      getApprovalRequestListTableId() {
        return 'approvalRequestListTable';
      },

      /**
       * Overview box handler 반환
       * 반드시 overriding하여 사용할 것
       * @abstract
       */
      getOverviewBoxHandler() {
        // {commmon.approvalRequest.ListController} {getOverviewBoxHandler} function을 구현하세요.
        throw new Error(this.getBundleText('MSG_APRV001', 'commmon.approvalRequest.ListController', 'getOverviewBoxHandler'));
      },

      /**
       * Search box handler 반환
       * 반드시 overriding하여 사용할 것
       * @abstract
       */
      getSearchBoxHandler() {
        // {commmon.approvalRequest.ListController} {getSearchBoxHandler} function을 구현하세요.
        throw new Error(this.getBundleText('MSG_APRV001', 'commmon.approvalRequest.ListController', 'getSearchBoxHandler'));
      },

      /**
       * 신청 목록에서 첨부파일 목록을 즉시 확인할 수 있는 dialog 사용 여부 반환
       * @returns
       */
      useFileListDialog() {
        // {common.approvalRequest.ListController} {useFileListDialog} function을 overriding 할 수 있습니다.
        this.debug(this.getBundleText('MSG_APRV002', 'common.approvalRequest.ListController', 'useFileListDialog'));
        return false;
      },

      /**
       * 신청 목록에서 첨부파일 목록을 즉시 확인할 수 있는 dialog handler 반환
       */
      getFileListDialogHandler() {
        // {common.approvalRequest.ListController} {getFileListDialogHandler} function을 overriding 할 수 있습니다.
        this.debug(this.getBundleText('MSG_APRV002', 'common.approvalRequest.ListController', 'getFileListDialogHandler'));
        return new FileListDialogHandler(this);
      },

      /**
       * Appointee box 사원검색 후 callback
       */
      callbackAppointeeChange() {
        if (this.oOverviewBoxHandler) {
          this.oOverviewBoxHandler.showData();
        }
        if (this.oSearchBoxHandler) {
          this.oSearchBoxHandler.onPressIcon();
        }
      },

      /**
       * Overview box 조회 button click event handler
       * @param {*} oEvent
       */
      onPressOverviewBoxIcon(oEvent) {
        this.oOverviewBoxHandler.onPressIcon(oEvent);
      },

      /**
       * 검색 box 조회 button click event handler
       * @param {*} oEvent
       */
      onPressSearch(oEvent) {
        this.oSearchBoxHandler.onPressIcon(oEvent);
      },

      /**
       * 신규신청 button click event handler
       */
      onPressNewRequest() {
        this.getRouter().navTo(`${this.sRouteName}-detail`, { sAppno: 0 });
      },

      /**
       * 신청 목록 Excel download icon click event handler
       */
      onPressExelDownload() {
        const oTable = this.byId(this.getApprovalRequestListTableId());
        const sFileName = this.getExcelFileName();

        this.TableUtils.export({ oTable, sFileName });
      },

      /**
       * 신청 목록 Excel 파일명
       * 반드시 overriding하여 사용할 것
       * @abstract
       */
      getExcelFileName() {
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_00121'); // {신청}_목록

        // commmon.approvalRequest.ListController getExcelFileName function이 overriding되지 않아 '{신청_목록}'이 반환됩니다.
        this.debug(this.getBundleText('MSG_APRV003', sFileName));

        return sFileName;
      },

      /**
       * 신청 목록의 행 click event handler
       * @param {*} oEvent
       */
      onSelectRow(oEvent) {
        const sAppno = oEvent.getParameter('rowBindingContext').getProperty('Appno');

        this.getRouter().navTo(`${this.sRouteName}-detail`, { sAppno });
      },

      /**
       * 신청 목록의 첨부 파일 download icon click event handler
       * @param {*} oEvent
       */
      async onPressRowAttachmentDownload(oEvent) {
        this.oFileListDialogHandler.openDialog(oEvent);
      },

      /**
       * 사용하지 않음, 참고용으로 코드를 남겨둠
       */
      async NOTUSE_onPressRowAttachmentDownload(oEvent) {
        const sAppno = oEvent.getSource().getBindingContext().getProperty('Appno');
        const { ApprovalType } = this.getApprovalRequestConfig();
        const [{ Fileuri }] = await FileDataProvider.readListData(sAppno, ApprovalType);
        FileDataProvider.openFileLink(Fileuri);
      },
    });
  }
);
