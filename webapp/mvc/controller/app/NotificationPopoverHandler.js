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

    return BaseObject.extend('sap.ui.yesco.mvc.controller.app.NotificationPopoverHandler', {
      /**
       * @override
       */
      constructor: function (oController) {
        this.oController = oController;
        this.oPopoverModel = new JSONModel(this.getInitialData());

        this.init();
      },

      getInitialData() {
        return {
          popover: {
            busy: true,
            list: null,
          },
        };
      },

      async init() {
        this.oNotificationPopover = await Fragment.load({
          name: 'sap.ui.yesco.mvc.view.app.fragment.NotificationPopover',
          controller: this,
        });

        this.oNotificationPopover
          .attachBeforeOpen(() => {
            this.getPopoverModel().setProperty('/popover/list', null);
          })
          .attachAfterClose(() => {
            this.getPopoverModel().setProperty('/popover/list', null);
          })
          .setModel(this.getPopoverModel());

        this.getController().getView().addDependent(this.oNotificationPopover);
      },

      async showContentData() {
        const aContentData = await this.readContentData();
        const mContentData = this.transformContentData(aContentData);

        this.getPortletModel().setData(mContentData, true);
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);
        const mFilters = {
          Mode: 'L',
          Unide: '',
        };

        return Client.getEntitySet(oModel, 'AlarmCenter', mFilters);
      },

      transformContentData(aPortletContentData) {
        const mPortletContentData = aPortletContentData[0] || {};

        if (mPortletContentData.__metadata) {
          delete mPortletContentData.__metadata;
        }

        return mPortletContentData;
      },

      onPressClose() {
        this.oNotificationPopover.close();
      },

      getController() {
        return this.oController;
      },

      setPopoverModel(oPopoverModel) {
        this.oPopoverModel = oPopoverModel;
        return this;
      },

      getPopoverModel() {
        return this.oPopoverModel;
      },

      setBusy(bBusy = true) {
        setTimeout(() => {
          this.getPopoverModel().setProperty('/popover/busy', bBusy);
        });
        return this;
      },
    });
  }
);
