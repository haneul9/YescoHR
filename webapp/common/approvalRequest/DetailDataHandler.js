/* eslint-disable no-unused-vars */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/exceptions/UI5Error',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Debuggable,
    UI5Error
  ) => {
    'use strict';

    /**
     * class 실사용은 nightduty, leavOfAbsence 참고할 것
     */
    return Debuggable.extend('sap.ui.yesco.common.approvalRequest.DetailDataHandler', {
      constructor: function (oController) {
        this.oController = oController;

        this.onInit();
      },

      onInit() {
        // {common.approvalRequest.DetailDataHandler} {onInit} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.DetailDataHandler', 'onInit'));
      },

      getApprovalRequestModelInitDetailData() {
        // {common.approvalRequest.DetailDataHandler} {getApprovalRequestModelInitDetailData} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.DetailDataHandler', 'getApprovalRequestModelInitDetailData'));
        return {};
      },

      // eslint-disable-next-line no-unused-vars
      onAfterInitModel(oApprovalRequestModel) {
        // {commmon.approvalRequest.DetailDataHandler} {onAfterInitModel} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'commmon.approvalRequest.DetailDataHandler', 'onAfterInitModel'));
      },

      getApprovalRequestModel() {
        return this.oController.getApprovalRequestModel();
      },

      setConfigProperty(sPropertyName, vValue) {
        this.oController.setConfigProperty(sPropertyName, vValue);
        return this;
      },

      getConfigProperty(sPropertyName) {
        return this.oController.getConfigProperty(sPropertyName);
      },

      mergeConfigData(mData) {
        this.oController.mergeConfigData(mData);
        return this;
      },

      getConfigData() {
        return this.oController.getConfigData();
      },

      setDetailProperty(sPropertyName, vValue) {
        this.oController.setDetailProperty(sPropertyName, vValue);
        return this;
      },

      getDetailProperty(sPropertyName) {
        return this.oController.getDetailProperty(sPropertyName);
      },

      mergeDetailData(mData) {
        this.oController.mergeDetailData(mData);
        return this;
      },

      getDetailData() {
        return this.oController.getDetailData();
      },

      getAppno() {
        return this.oController.getAppno();
      },

      getStatus() {
        return this.oController.getStatus();
      },

      isFormEditable() {
        return this.oController.isFormEditable();
      },

      getFileAttachmentBoxHandler() {
        return this.oController.getFileAttachmentBoxHandler();
      },

      showFileAttachmentBox() {
        // {common.approvalRequest.DetailDataHandler} {showFileAttachmentBox} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.DetailDataHandler', 'showFileAttachmentBox'));
        return true;
      },

      async onBeforeReadData() {
        // {common.approvalRequest.DetailDataHandler} {onBeforeReadData} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.DetailDataHandler', 'onBeforeReadData'));
        return;
      },

      /**
       * 신청 상세 정보 조회
       * @abstract
       * @param {string} sAppno
       * @returns {promise}
       */
      async readData(sAppno) {
        // {common.approvalRequest.DetailDataHandler} {readData} function을 구현하세요.
        throw new UI5Error({ message: AppUtils.getBundleText('MSG_APRV001', 'common.approvalRequest.DetailDataHandler', 'readData') });
      },

      /**
       * 신청 상세 정보 가공
       * @abstract
       * @param {array} aResultsData
       * @param {boolean} bFormEditable
       */
      async showData(aResultsData, bFormEditable) {
        // {common.approvalRequest.DetailDataHandler} {showData} function을 구현하세요.
        throw new UI5Error({ message: AppUtils.getBundleText('MSG_APRV001', 'common.approvalRequest.DetailDataHandler', 'showData') });
      },

      /**
       * 재작성
       */
      rewrite() {
        // {common.approvalRequest.DetailDataHandler} {rewrite} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.DetailDataHandler', 'rewrite'));
        this.oController.setStatus(null);
        this.oController.setEditable(true);
        this.oController.setEnabled(true);
        this.oController.setAppno(null);
        this.getFileAttachmentBoxHandler().clearFileList();
        this.oController.setApplyInfoBoxData(null);
        this.oController.setApprovalBoxData(null);
        return this;
      },

      /**
       * 신청 상세 정보 유효성 검사
       * @returns {boolean} true: 이상무, false: 오류
       */
      validateRequestData() {
        // {common.approvalRequest.DetailDataHandler} {validateRequestData} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.DetailDataHandler', 'validateRequestData'));
        return true;
      },

      /**
       * 신청
       * @abstract
       * @param {string} sAppno
       * @param {string} sPrcty - T:임시저장, C:신청
       */
      requestApproval({ sAppno, sPrcty = 'C' }) {
        // {common.approvalRequest.DetailDataHandler} {requestApproval} function을 구현하세요.
        throw new UI5Error({ message: AppUtils.getBundleText('MSG_APRV001', 'common.approvalRequest.DetailDataHandler', 'requestApproval') });
      },

      /**
       * 삭제
       * @param {string} sAppno
       */
      removeRequestApproval({ sAppno }) {
        // {common.approvalRequest.DetailDataHandler} {removeRequestApproval} function을 구현하세요.
        throw new UI5Error({ message: AppUtils.getBundleText('MSG_APRV001', 'common.approvalRequest.DetailDataHandler', 'removeRequestApproval') });
      },

      /**
       * 신청 callback
       */
      onAfterRequestApproval() {
        // {common.approvalRequest.DetailDataHandler} {onAfterRequestApproval} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.DetailDataHandler', 'onAfterRequestApproval'));
        this.oController.onNavBack();
        return this;
      },

      /**
       * 임시저장 callback
       */
      onAfterSave() {
        // {common.approvalRequest.DetailDataHandler} {onAfterSave} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.DetailDataHandler', 'onAfterSave'));
        return this;
      },

      /**
       * 재작성 callback
       */
      onAfterRewrite() {
        // {common.approvalRequest.DetailDataHandler} {onAfterRewrite} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.DetailDataHandler', 'onAfterRewrite'));
        return this;
      },

      /**
       * 삭제 callback
       */
      onAfterRemove() {
        // {common.approvalRequest.DetailDataHandler} {onAfterRemove} function을 overriding 할 수 있습니다.
        this.debug(AppUtils.getBundleText('MSG_APRV002', 'common.approvalRequest.DetailDataHandler', 'onAfterRemove'));
        this.oController.onNavBack();
        return this;
      },
    });
  }
);
