sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/HBox',
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/control/PortletBox',
  ],
  (
    // prettier 방지용 주석
    HBox,
    Fragment,
    JSONModel,
    AppUtils,
    Debuggable,
    UI5Error,
    MessageBox,
    PortletBox
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.home.portlets.AbstractPortletHandler', {
      sContainerId: 'portlets-grid',
      oPortletBox: null,

      /**
       * @override
       */
      constructor: function (oController, mPortletData) {
        this.oController = oController;
        this.oPortletModel = new JSONModel(mPortletData);

        this.init();
      },

      async init() {
        this.addPortlet();
        this.showContentData();
        this.setBusy(false);
      },

      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const sPortletID = oPortletModel.getProperty('/id');
        const oPortletBodyContent = await Fragment.load({
          name: `sap.ui.yesco.mvc.view.home.fragment.${sPortletID}PortletBodyContent`,
          controller: this,
        });

        const oPortletBox = new PortletBox({ portletHandler: this }).setModel(oPortletModel).bindElement('/');
        oPortletBox.getItems()[1].addItem(oPortletBodyContent);

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);
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
        const oPortletModel = this.getPortletModel();
        const bHasLink = oPortletModel.getProperty('/hasLink');
        const sUrl = oPortletModel.getProperty('/url');
        if (!bHasLink || !sUrl) {
          const sTitle = oPortletModel.getProperty('/title');
          MessageBox.alert(AppUtils.getBundleText('MSG_01903', sTitle)); // {sTitle} portlet의 더보기 링크가 없거나 설정이 올바르지 않습니다.
          return;
        }

        this.navTo(sUrl);
      },

      navTo(...aArgs) {
        AppUtils.setMenuBusy(true).setAppBusy(true);

        this.getController()
          .reduceViewResource()
          .getRouter()
          .navTo(...aArgs);
      },

      onAfterDragAndDrop() {},

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

      setPortletBox(oPortletBox) {
        this.oPortletBox = oPortletBox;
        return this;
      },

      getPortletBox() {
        return this.oPortletBox;
      },

      setBusy(bBusy = true, sPath = '/busy') {
        setTimeout(
          () => {
            this.getPortletModel().setProperty(sPath, bBusy);
          },
          bBusy ? 0 : 500
        );
        return this;
      },

      destroy() {
        const oPortletModel = this.getPortletModel();

        this.resetPortletData(oPortletModel.getProperty('/id'));

        oPortletModel.destroy();
        this.getPortletBox().destroy();
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
