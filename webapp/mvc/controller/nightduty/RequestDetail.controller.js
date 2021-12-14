sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/table/SelectionMode',
    'sap/ui/yesco/common/ApprovalRequestHelper',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/nightduty/RequestDetailHelper',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    SelectionMode,
    ApprovalRequestHelper,
    AppUtils,
    AttachFileAction,
    TextUtils,
    UI5Error,
    ODataCreateError,
    ServiceNames,
    MessageBox,
    BaseController,
    RequestDetailHelper
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.nightduty.RequestDetail', {
      oApprovalRequestHelper: null,
      oRequestDetailHelper: null,
      oCurrentListDialogHandler: null,
      sDetailListTableId: 'detailListTable',
      sTYPE_CODE: 'HR06',

      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,

      getCurrentLocationText(mArguments) {
        return mArguments.sAppno ? this.getBundleText('LABEL_00100') : this.getBundleText('LABEL_00121'); // 조회 : 신청
      },

      getDocumentType() {
        return this.sTYPE_CODE;
      },

      onBeforeShow() {
        this.oApprovalRequestHelper = new ApprovalRequestHelper(this);
        this.oRequestDetailHelper = new RequestDetailHelper(this);
      },

      async onObjectMatched(mParameters = {}) {
        this.oApprovalRequestHelper.setAppno(mParameters.sAppno);

        this.readData();
      },

      async readData() {
        const oViewModel = this.getViewModel();
        const sAppno = this.oApprovalRequestHelper.getAppno();

        try {
          if (sAppno) {
            const aDetailListData = await this.oRequestDetailHelper.readRequestDetailData(sAppno);
            const mDetailData = aDetailListData[0] || {};

            this.oRequestDetailHelper.setData(aDetailListData, this.oApprovalRequestHelper.isFormEditable());
            this.oApprovalRequestHelper.setData(mDetailData, true); // 첨부파일, 신청자, 결재정보 세팅
          } else {
            const aEmployees = await this.readEmpSearchResult();

            oViewModel.setProperty(
              '/detail/employees',
              aEmployees.map((o) => ({ ...o, Pernr: o.Pernr.replace(/^0+/, '') }))
            );

            this.oApprovalRequestHelper.setApplyInfoBoxData();
          }
        } catch (oError) {
          this.debug('Controller > Nightduty Detail > readData Error', oError);

          if (oError instanceof Error) {
            oError = new UI5Error({ message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          AppUtils.handleError(oError, {
            onClose: () => this.getRouter().navTo('nightduty'),
          });
        }
      },

      onPressAddRowButton() {
        this.oRequestDetailHelper.openCurrentListDialog();
      },

      onPressRemoveRowButton() {
        this.oRequestDetailHelper.removeDetailListTableRows();
      },

      async retrieveCurrentDuty() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const oViewModel = this.getViewModel();
        const aDetailListData = oViewModel.getProperty('/detail/list');
        const sMode = oViewModel.getProperty('/dialog/mode');
        const sYearMonth = oViewModel.getProperty('/dialog/yearMonth');

        try {
          oViewModel.setProperty('/dialog/busy', true);

          let aSummaryList = await this.readDrillList({ oModel, sMode, sYearMonth });

          aSummaryList = _.differenceWith(aSummaryList, aDetailListData, (a, b) => moment(a.Datum).format('YYYYMMDD') === moment(b.Datum).format('YYYYMMDD'));

          oViewModel.setProperty('/dialog/list', aSummaryList);
          oViewModel.setProperty('/dialog/rowCount', aSummaryList.length || 1);
        } catch (oError) {
          this.debug('Controller > excavation Detail > retrieveCurrentDuty Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
        }
      },

      onSelectSuggestion(oEvent) {
        this.oRequestDetailHelper.onSelectSuggestion(oEvent);
      },

      /**
       * 신청 button click event handler
       */
      onPressRequestApproval() {
        this.oApprovalRequestHelper.confirmRequest();
      },

      /**
       * 신청 data 유효성 검사
       * @returns {boolean} 신청 data 유효 여부
       */
      validateRequestData() {
        const oViewModel = this.getViewModel();
        const aDetailListData = oViewModel.getProperty('/detail/list');
        const sChgrsn = oViewModel.getProperty('/detail/chgrsn').trim();

        if (!sChgrsn) {
          MessageBox.alert(this.getBundleText('MSG_00003', 'LABEL_04013')); // {변경사유}를 입력하세요.
          return false;
        }

        if (!_.every(aDetailListData, 'PernrA')) {
          MessageBox.alert(this.getBundleText('MSG_00005', 'LABEL_11006')); // {근무자}를 선택하세요.
          return false;
        }

        return true;
      },

      /**
       * 신청
       * @param {string} sPrcty - T:임시저장, C:신청
       * @returns
       */
      requestApproval({ sPrcty = 'C' }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/OnCallChangeAppSet';
          const sMenid = this.getCurrentMenuId();
          const sAppno = this.oApprovalRequestHelper.getAppno();
          const oViewModel = this.getViewModel();
          const aDetailListData = oViewModel.getProperty('/detail/list');
          const sChgrsn = oViewModel.getProperty('/detail/chgrsn');

          const mPayload = {
            Menid: sMenid,
            Appno: sAppno,
            Prcty: sPrcty,
            Chgrsn: sChgrsn,
            OnCallChangeNav: aDetailListData.map((o) => ({ ...o, Chgrsn: sChgrsn })),
          };

          this.getModel(ServiceNames.WORKTIME).create(sUrl, mPayload, {
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataCreateError({ oError })); // {신청}중 오류가 발생하였습니다.
            },
          });
        });
      },

      /**
       * 신청 성공 후 목록으로 이동
       */
      onAfterRequestApproval() {
        this.getRouter().navTo('nightduty');
      },
    });
  }
);
