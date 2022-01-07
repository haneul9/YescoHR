sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/UIComponent',
    'sap/ui/core/mvc/Controller',
    'sap/ui/core/routing/HashChanger',
    'sap/ui/core/routing/History',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/UI5Error',
  ],
  (
    // prettier 방지용 주석
    UIComponent,
    Controller,
    HashChanger,
    History,
    AppUtils,
    UI5Error
  ) => {
    'use strict';

    return Controller.extend('sap.ui.yesco.mvc.controller.BaseController', {
      onInit() {
        this.debug('BaseController.onInit');

        // 각 업무 controller에서는 onInit overriding 대신 onBeforeShow, onAfterShow를 사용할 것
        this.getView().addEventDelegate(
          {
            onBeforeShow: this.onBeforeShow,
            onAfterShow: this.onAfterShow,
          },
          this
        );
      },

      onBeforeShow() {
        this.debug('BaseController.onBeforeShow');
      },

      onAfterShow() {
        this.debug('BaseController.onAfterShow');

        const oInfoMegBox = this.byId('InfoMegBox');
        if (oInfoMegBox) {
          const bIsInfoMessage = !!this.getViewModel().getProperty('/InfoMessage');
          oInfoMegBox.setVisible(bIsInfoMessage);
        }

        AppUtils.setAppBusy(false).setMenuBusy(false);
      },

      /**
       * Breadcrumbs 마지막 부분의 현재 메뉴 화면 title 제공 function.
       * 업무 controller에서 로직으로 title을 변경해야할 경우 구현하여 사용할 것.
       * Component.js에서 호출하여 반환받은 string을 Breadcrumbs에 넣어줌.
       * @param {object} oArguments Router의 routeMatched event의 getParameter('arguments') 값
       * @returns {string}
       */
      getCurrentLocationText: null,

      /**
       * Convenience method for accessing the router in every controller of the application.
       * @public
       * @returns {sap.ui.core.routing.Router} the router for this component
       */
      getRouter() {
        // return this.getOwnerComponent().getRouter();
        return UIComponent.getRouterFor(this);
      },

      isHass() {
        return /^h\//.test(HashChanger.getInstance().getHash());
      },

      /**
       * Convenience method for setting the view model in every controller of the application.
       * @public
       * @param {sap.ui.model.Model} oModel the model instance
       * @param {string} sName the model name
       * @returns {sap.ui.mvc.View} the view instance
       */
      setViewModel(oModel, sName) {
        return this.getView().setModel(oModel, sName);
      },

      /**
       * Convenience method for getting the view model by name in every controller of the application.
       * @public
       * @param {string} sName the model name
       * @returns {sap.ui.model.Model} the model instance
       */
      getViewModel(sName) {
        return this.getView().getModel(sName);
      },

      /**
       * Convenience method for getting the component model by name in every controller of the application.
       * @public
       * @param {string} sName the model name
       * @returns {sap.ui.model.Model} the model instance
       */
      getModel(sName) {
        return this.getOwnerComponent().getModel(sName);
      },

      /**
       * Convenience method for getting the resource bundle text.
       * @public
       * @param {...string} aArgs a key of resource bundle text.
       * @returns {string} The value belonging to the key, if found; otherwise the key itself.
       */
      getBundleText(...aArgs) {
        return this.getOwnerComponent().getBundleText(...aArgs);
      },

      getMenuModel() {
        return this.getOwnerComponent().getMenuModel();
      },

      getCurrentMenuRouteName() {
        return this.getMenuModel().getCurrentMenuRouteName();
      },

      getCurrentMenuViewId() {
        return this.getMenuModel().getCurrentMenuViewId();
      },

      getCurrentMenuId() {
        return this.getMenuModel().getCurrentMenuId();
      },

      getSessionModel() {
        return this.getOwnerComponent().getSessionModel();
      },

      getSessionData() {
        return this.getSessionModel().getData();
      },

      getSessionProperty(sPath) {
        return this.getSessionModel().getProperty(`/${sPath}`);
      },

      getAppointeeModel() {
        return this.getOwnerComponent().getAppointeeModel();
      },

      getAppointeeData() {
        return this.getAppointeeModel().getData();
      },

      getAppointeeProperty(sPath) {
        return this.getAppointeeModel().getProperty(`/${sPath}`);
      },

      getEntityLimit(sServiceName, sEntityType) {
        return (
          _.chain(this.getOwnerComponent().getMetadataModel().getData())
            .get([sServiceName, sEntityType])
            .omitBy(_.isString)
            .reduce((acc, cur) => ({ ...acc, [cur.name]: _.toInteger(cur.maxLength) }), {})
            .omit(_.isUndefined)
            .omit(_.isNull)
            .value() ?? {}
        );
      },

      getPropertyLimit(sServiceName, sEntityType, sProperty) {
        return _.chain(this.getOwnerComponent().getMetadataModel().getData()).get([sServiceName, sEntityType, sProperty, 'maxLength']).toInteger().value();
      },

      /**
       * Event handler for navigating back.
       * It there is a history entry we go one step back in the browser history
       * If not, it will replace the current entry of the browser history with the master route.
       * @public
       */
      onNavBack() {
        const sPreviousHash = History.getInstance().getPreviousHash();

        const oUIComponent = this.getOwnerComponent();
        oUIComponent.reduceViewResource();

        if (sPreviousHash) {
          window.history.go(-1);
        } else {
          const sPreviousRouteName = this.getPreviousRouteName() || 'ehrHome'; // TODO : ehrMobileHome
          oUIComponent.getRouter().navTo(sPreviousRouteName, {}, true /* no history */);
        }
      },

      /**
       *
       */
      reduceViewResource: null,

      /**
       * abstract
       * @returns
       */
      getPreviousRouteName() {
        return null;
      },

      /**
       * ApprovalRequestHelper에서 호출
       * @returns
       */
      getApprovalType() {
        throw new UI5Error({ message: this.getBundleText('MSG_00053', 'Controller', 'getApprovalType') }); // {Controller}에 {getApprovalType} function을 선언하세요.
      },

      onRefresh() {
        this.debug('BaseController.onRefresh');
      },

      navToNotFound() {
        // display the "notFound" target without changing the hash
        this.getRouter().getTargets().display('notFound', {
          from: 'home',
        });
      },

      /**
       * FileAttachmentBox.fragment.xml
       */
      onAttachmentChange(oEvent) {
        this.getFileAttachmentBoxHandler().onAttachmentChange(oEvent);
      },

      /**
       * FileAttachmentBox.fragment.xml
       */
      onAttachmentUploadComplete(oEvent) {
        this.getFileAttachmentBoxHandler().onAttachmentUploadComplete(oEvent);
      },

      /**
       * FileAttachmentBox.fragment.xml
       */
      onAttachmentRemove(oEvent) {
        this.getFileAttachmentBoxHandler().onAttachmentRemove(oEvent);
      },

      /**
       * FileAttachmentBox.fragment.xml
       */
      onAttachmentRemoveCancel(oEvent) {
        this.getFileAttachmentBoxHandler().onAttachmentRemoveCancel(oEvent);
      },

      getFileAttachmentBoxHandler() {
        return this.FileAttachmentBoxHandler;
      },

      /**
       * Convenience method for logging.
       * @protected
       */
      debug(...aArgs) {
        AppUtils.debug(...aArgs);
        return this;
      },
    });
  }
);
