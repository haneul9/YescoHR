sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/control/MessageBox',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    Fragment,
    JSONModel,
    AppUtils,
    UI5Error,
    MessageBox
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

        const oFragment = await Fragment.load({
          name: `sap.ui.yesco.mvc.view.home.fragment.Portlets${sPortletId}`,
          controller: this,
        });

        const iPortletHeight = oPortletModel.getProperty('/height');
        oFragment.setModel(oPortletModel).bindElement('/').addStyleClass(`portlet-height-${iPortletHeight}`);

        this.oController.byId(this.sContainerId).addItem(oFragment);
        this.setFragment(oFragment);
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

      onPressClose(oEvent) {
        const sTitle = oEvent.getSource().getBindingContext().getProperty('title');
        const sMessage = AppUtils.getBundleText('MSG_01902', sTitle); // {sTitle} portlet을 홈화면에 더이상 표시하지 않습니다.\n다시 표시하려면 홈화면 우측 상단 톱니바퀴 아이콘을 클릭하여 설정할 수 있습니다.

        MessageBox.confirm(sMessage, {
          onClose: async (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              return;
            }

            const oPortletModel = this.getPortletModel();
            const sPortletId = oPortletModel.getProperty('/id');
            const bSuccess = await this.getController().onPressPortletsP13nSave(sPortletId);
            if (bSuccess) {
              this.destroy();
            }
          },
        });
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

      setFragment(oFragment) {
        this.oFragment = oFragment;
        return this;
      },

      getFragment() {
        return this.oFragment;
      },

      setBusy(bBusy = true, sPath = '/busy') {
        setTimeout(() => {
          this.getPortletModel().setProperty(sPath, bBusy);
        });
        return this;
      },

      destroy() {
        const oPortletModel = this.getPortletModel();

        this.resetPortletData(oPortletModel.getProperty('/id'));

        oPortletModel.destroy();
        this.getFragment().destroy();
      },

      resetPortletData(sPortletId) {
        const oPortletsModel = this.getController().getViewModel();

        oPortletsModel.setProperty(`/allMap/${sPortletId}/active`, false);
        oPortletsModel.setProperty(`/allMap/${sPortletId}/position/column`, 1);
        oPortletsModel.setProperty(`/allMap/${sPortletId}/position/sequence`, 0);
        _.remove(oPortletsModel.getProperty('/activeList'), (mPortletData) => {
          return mPortletData.id === sPortletId;
        });

        delete oPortletsModel.getProperty('/activeMap')[sPortletId];
        delete oPortletsModel.getProperty('/activeInstanceMap')[sPortletId];

        oPortletsModel.refresh();
      },
    });
  }
);
