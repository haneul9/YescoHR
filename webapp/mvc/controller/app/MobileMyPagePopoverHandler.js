sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/PlacementType',
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/model/type/Date', // XML expression binding용 type preloading
    'sap/ui/yesco/mvc/model/type/Time',
  ],
  (
    // prettier 방지용 주석
    PlacementType,
    Fragment,
    JSONModel,
    AppUtils,
    Debuggable,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.app.MobileMyPagePopoverHandler', {
      bMobile: null,

      /**
       * @override
       */
      constructor: function (oController) {
        this.bMobile = AppUtils.isMobile();
        this.oController = oController;
        this.oMyPageModel = new JSONModel(this.getInitialData());

        this.init();
      },

      getInitialData() {
        return {
          busy: true,
        };
      },

      async init() {
        const oView = this.oController.getView();

        this.oMyPagePopover = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.mvc.view.app.fragment.MyPagePopover',
          controller: this,
        });

        this.oMyPagePopover
          .attachBeforeOpen(() => {
            // this.onChangeMyPageOnlyUnread();
          })
          .setModel(this.oMyPageModel)
          .bindElement('/');

        oView.addDependent(this.oMyPagePopover);

        this.showContentData();
      },

      async showContentData() {
        const aContentData = await this.readContentData();
        const sVersion = this.transformContentData(aContentData);

        this.oMyPageModel.setProperty('/Version', sVersion);
      },

      async readContentData() {
        const oCommonModel = this.oController.getModel(ServiceNames.COMMON);
        const mFilters = {
          Mobos: /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'IOS' : 'ANDROID',
        };

        return Client.getEntitySet(oCommonModel, 'OsVersion', mFilters);
      },

      transformContentData([{ Version }]) {
        return Version;
      },

      onChangeMobilePushOnOff() {},

      async onPressLogout() {
        this.oController.onPressLogout();
      },

      onPopoverToggle() {
        if (this.oMyPagePopover.isOpen()) {
          this.onPopoverClose();
        } else {
          this.oMyPagePopover.openBy(this.oController.byId('my-page'));
          this.setBusy(false);
        }
      },

      onPopoverClose() {
        this.oMyPagePopover.close();
      },

      setBusy(bBusy = true) {
        setTimeout(
          () => {
            this.oMyPageModel.setProperty('/busy', bBusy);
          },
          bBusy ? 0 : 500
        );
        return this;
      },
    });
  }
);
