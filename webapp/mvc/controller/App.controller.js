sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/app/Menus',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment, 
    Menus,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.App', {
      onInit() {
        this.debug('App.onInit');

        // apply content density mode to root view
        this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

        this.oAppMenu = new Menus(this);
      },

      navToHome() {
        this.oAppMenu.closeMenuLayer();

        const sCurrentMenuViewId = this.getCurrentMenuViewId();
        if (sCurrentMenuViewId === 'home') {
          return;
        }

        this.getOwnerComponent().reduceViewResource();

        this.getRouter().navTo('ehrHome');

        // TODO : master 전환 후 callback 호출 필요(ex: localStorage, sessionStorage, global temporary variables/functions 등 제거 callback)
      },

      getLogoPath(sWerks = 'init') {
        this.byId('logoImage').toggleStyleClass(`logo-${sWerks}`, true);
        return `asset/image/logo-${sWerks}.png`;
      },

      navToProfile() {
        this.getRouter().navTo('employee');
      },

      onExit: function () {
        if (this._oPopover) {
          this._oPopover.destroy();
        }
      },
  
      notifyOpenPopover: function (oEvent) {
        var oButton = oEvent.getSource();
  
        // create popover
        if (!this._oPopover) {
          Fragment.load({
            name: "sap.ui.yesco.fragment.app.NotifyPopover",
            controller: this
          }).then(function(pPopover) {
            this._oPopover = pPopover;
            this.getView().addDependent(this._oPopover);
            this._oPopover.bindElement("/ProductCollection/0");
            this._oPopover.openBy(oButton);
          }.bind(this));
        } else {
          this._oPopover.openBy(oButton);
        }
      },
  
      notifyClosePopover: function () {
        this._oPopover.close();
      },

      settingDialog() {
        if (!this.byId('settingDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.fragment.app.SettingDialog',
            controller: this,
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            oDialog.open();
          });
        }else {
          this.byId('settingDialog').open();
        }
      },

      onClick() {
        this.byId('settingDialog').close();
      },

    });
  }
);
