sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/UI5Error',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    Fragment,
    JSONModel,
    AppUtils,
    UI5Error
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.mvc.controller.home.portlets.AbstractPortletHandler', {
      sContainerId: 'portlets-grid',
      oFragment: null,

      /**
       * @override
       */
      constructor: function (oController, mPortletData) {
        this.setController(oController) // prettier 방지용 주석
          .setPortletModel(new JSONModel(mPortletData))
          .setWidth()
          .init();
      },

      async init() {
        this.addPortlet();
        this.showContentData();
        this.setBusy(false);
      },

      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const sPortletId = oPortletModel.getProperty('/id');

        this.oFragment = await Fragment.load({
          name: `sap.ui.yesco.mvc.view.home.fragment.Portlets${sPortletId}`,
          controller: this,
        });

        const iPortletHeight = oPortletModel.getProperty('/height');
        this.oFragment.setModel(oPortletModel).bindElement('/').addStyleClass(`portlet-height-${iPortletHeight}`);

        this.oController.byId(this.sContainerId).addItem(this.oFragment);
      },

      async showContentData() {
        const aPortletContentData = await this.readContentData();
        const mPortletContentData = this.transformContentData(aPortletContentData);

        this.getPortletModel().setData(mPortletContentData, true);
      },

      transformContentData(aPortletContentData) {
        const mPortletContentData = aPortletContentData[0] || {};

        if (mPortletContentData.__metadata) {
          delete mPortletContentData.__metadata;
        }

        return mPortletContentData;
      },

      setWidth() {
        this.getPortletModel().setProperty('/width', this.getWidth());
        return this;
      },

      getWidth() {
        return 1;
      },

      /**
       *
       * @returns
       */
      async readContentData() {
        throw new UI5Error({ message: AppUtils.getBundleText('MSG_00053', `${sPortletId}PortletHandler`, 'readContentData') }); // {PortletHandler}에 {readContentData} function을 선언하세요.
      },

      onPressClose() {
        const sTitle = this.getPortletModel().getProperty('/title');
        alert(`${sTitle} Portlet 사용안함 : 준비중!`);
      },

      onPressLink() {
        const sTitle = this.getPortletModel().getProperty('/title');
        alert(`${sTitle} Portlet 더보기 링크 : 준비중!`);
      },

      navTo(...aArgs) {
        AppUtils.setMenuBusy(true).setAppBusy(true);

        this.getController()
          .reduceViewResource()
          .getRouter()
          .navTo(...aArgs);
      },

      setController(oController) {
        this.oController = oController;
        return this;
      },

      getController() {
        return this.oController;
      },

      setPortletModel(oPortletModel) {
        this.oPortletModel = oPortletModel;
        return this.setBusy();
      },

      getPortletModel() {
        return this.oPortletModel;
      },

      setBusy(bBusy = true, sPath = '/busy') {
        setTimeout(() => {
          this.getPortletModel().setProperty(sPath, bBusy);
        });
        return this;
      },

      destroy() {
        this.oPortletModel.destroy();
        this.oFragment.destroy();
      },
    });
  }
);
