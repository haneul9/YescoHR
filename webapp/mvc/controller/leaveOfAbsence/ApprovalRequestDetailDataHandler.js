sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/DateUtils',
    'sap/ui/yesco/common/approvalRequest/DetailDataHandler',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    ComboEntry,
    DateUtils,
    ApprovalRequestDetailDataHandler,
    UI5Error,
    Client,
    ServiceNames,
    MessageBox
  ) => {
    'use strict';

    /**
     * 아래 function들은 모두 ApprovalRequestDetail.controller에서 호출됨
     */
    return ApprovalRequestDetailDataHandler.extend('sap.ui.yesco.mvc.controller.leaveOfAbsence.ApprovalRequestDetailDataHandler', {
      /**
       * 입력필드 설정 및 신청유형 목록 조회
       */
      async onBeforeReadData() {
        const { Zresn, Zname } = this.oController.getEntityLimit(ServiceNames.PA, 'LeaveAbsAppl');
        this.setConfigProperty('maxLength', { Zresn, Zname });

        const oModel = this.oController.getModel(ServiceNames.PA);
        const mFilters = {
          Werks: this.oController.getAppointeeProperty('Werks'),
        };

        const aResultsData = await Client.getEntitySet(oModel, 'LeaveAbsAppty', mFilters);

        this.setConfigProperty('ApptyList', new ComboEntry({ codeKey: 'Appty', valueKey: 'Apptytx', aEntries: aResultsData }));
      },

      /**
       * 신청 상세 조회
       * @param {string} sAppno
       * @returns {array} aResultsData
       */
      async readData(sAppno) {
        const oModel = this.oController.getModel(ServiceNames.PA);
        const mFilters = {
          Menid: this.oController.getCurrentMenuId(),
          Prcty: 'D',
          Appno: sAppno,
          Pernr: this.oController.getAppointeeProperty('Pernr'),
        };

        return Client.getEntitySet(oModel, 'LeaveAbsAppl', mFilters);
      },

      /**
       * 신청 상세 정보 가공
       * @param {array} aResultsData
       * @param {boolean} bFormEditable
       */
      async showData([mResultData]) {
        const mDetailData = mResultData || {};

        if (!this.getAppno()) {
          mDetailData.Appty = 'ALL';
        }

        const mItemProperty = this.getApptyProperties(mDetailData.Appty);

        this.setFieldControl(mItemProperty);
        this.getFileAttachmentBoxHandler().setDescription(mItemProperty.Zprint);
        this.mergeDetailData(mDetailData);

        return this;
      },

      getApptyProperties(sAppty) {
        sAppty = sAppty || this.getDetailProperty('Appty');
        const aApptyList = this.getConfigProperty('ApptyList');
        return _.find(aApptyList, ['Appty', sAppty]);
      },

      setFieldControl(mItemProperty) {
        this.setConfigProperty('fieldControl', this.getFieldControl(mItemProperty))
          .setDetailProperty('Begda', null)
          .setDetailProperty('Endda', null)
          .setDetailProperty('Zdays', 0)
          .setDetailProperty('Zresn', null)
          .setDetailProperty('Zname', null)
          .setDetailProperty('Birdt', null);
      },

      /**
       * @param {object} param = {
       *   Field1: Endda 종료일
       *   Field2: Zdays 기간일수
       *   Field3: Zresn 사유
       *   Field4: Zname 대상자 성명
       *   Field5: Birdt 출산(예정)일
       *   Field6: Attachment 첨부파일
       * }
       * @returns
       */
      getFieldControl({ Field1: Endda = 'X', Field2: Zdays = 'X', Field3: Zresn = 'X', Field4: Zname = 'X', Field5: Birdt = 'X', Field6: Attachment = 'X' }) {
        const iHidingFieldCount = [Endda, Zresn, Zname, Birdt].reduce((iCount, sFlag) => (sFlag === 'X' ? iCount + 1 : iCount), 0);
        const bRejected = this.oController.getStatus() === '65';
        const CssGridPad = iHidingFieldCount % 2 === 0 ? (bRejected ? 'X' : 'O') : bRejected ? 'O' : 'X';
        return {
          Endda,
          Zdays,
          Zresn,
          Zname,
          Birdt,
          Attachment,
          CssGridPad,
        };
      },

      showFileAttachmentBox() {
        return this.getConfigProperty('fieldControl/Attachment') !== 'X';
      },

      calculatePeriod(oEvent, aMessageCodes) {
        const oBegda = this.getDetailProperty('Begda');
        if (!oBegda) {
          return;
        }
        const oEndda = this.getDetailProperty('Endda');
        if (!oEndda) {
          return;
        }

        const mItemProperty = this.getApptyProperties();
        const { Endda, Zdays } = this.getFieldControl(mItemProperty);
        if (Endda === 'X') {
          return;
        }

        const oBegdaMoment = DateUtils.getMoment(oBegda);
        const oEnddaMoment = DateUtils.getMoment(oEndda);
        if (oBegdaMoment.isAfter(oEnddaMoment)) {
          MessageBox.alert(AppUtils.getBundleText(...aMessageCodes));
          oEvent.getSource().setValue(null);
          this.setDetailProperty('Zdays', 0);
          return;
        }

        if (Zdays === 'X') {
          return;
        }

        const iZdays = oEnddaMoment.diff(oBegdaMoment, 'days') + 1;
        this.setDetailProperty('Zdays', iZdays);
      },

      /**
       * 신청 정보 유효성 검사
       */
      validateRequestData() {
        const sAppty = this.getDetailProperty('Appty');
        if (!sAppty || sAppty === 'ALL') {
          throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00004', 'LABEL_50102') }); // {신청유형}을 선택하세요.
        }

        const mItemProperty = this.getApptyProperties();
        const { Endda, Zresn, Zname, Birdt, Attachment } = this.getFieldControl(mItemProperty);

        const oBegda = this.getDetailProperty('Begda');
        if (!oBegda) {
          throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00004', 'LABEL_50103') }); // {시작일}을 선택하세요.
        }
        if (Endda === 'M' && !this.getDetailProperty('Endda')) {
          throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00004', 'LABEL_50104') }); // {종료일}을 선택하세요.
        }
        if (Zresn === 'M' && !this.getDetailProperty('Zresn')) {
          throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00003', 'LABEL_50106') }); // {사유}를 입력하세요.
        }
        if (Zname === 'M' && !this.getDetailProperty('Zname')) {
          throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00002', 'LABEL_50107') }); // {대상자 성명}을 입력하세요.
        }
        if (Birdt === 'M' && !this.getDetailProperty('Birdt')) {
          throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00004', 'LABEL_50108') }); // {출산(예정)일}을 선택하세요.
        }
        if (Attachment === 'M' && !this.getFileAttachmentBoxHandler().getFileCount()) {
          throw new UI5Error({ code: 'A', message: AppUtils.getBundleText('MSG_00046') }); // 첨부파일을 등록하세요.
        }
      },

      /**
       * 신청
       * @param {string} sAppno
       * @param {string} sPrcty - T:임시저장, C:신청
       * @returns
       */
      requestApproval({ sAppno, sPrcty = 'C' }) {
        const mDetailData = this.getDetailData();
        const oModel = this.oController.getModel(ServiceNames.PA);
        const mPayload = {
          ...mDetailData,
          Menid: this.oController.getCurrentMenuId(),
          Pernr: this.oController.getAppointeeProperty('Pernr'),
          Appno: sAppno,
          Prcty: sPrcty,
        };

        return Client.create(oModel, 'LeaveAbsAppl', mPayload);
      },

      onAfterRewrite() {
        const sAppty = this.getDetailProperty('Appty');
        const mItemProperty = this.getApptyProperties(sAppty);

        this.setConfigProperty('fieldControl', this.getFieldControl(mItemProperty));
        this.getFileAttachmentBoxHandler().setDescription(mItemProperty.Zprint);
      },

      /**
       * 삭제
       * @param {string} sAppno
       * @returns
       */
      removeRequestApproval({ sAppno }) {
        const oModel = this.oController.getModel(ServiceNames.PA);
        const mPayload = {
          Menid: this.oController.getCurrentMenuId(),
          Pernr: this.oController.getAppointeeProperty('Pernr'),
          Appno: sAppno,
          Prcty: 'X',
        };

        return Client.create(oModel, 'LeaveAbsAppl', mPayload);
      },
    });
  }
);
