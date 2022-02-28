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
        const oView = this.getController().getView();

        this.oMyPagePopover = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.mvc.view.app.fragment.MyPagePopover',
          controller: this,
        });

        const oMyPageModel = this.getMyPageModel();

        this.oMyPagePopover
          .attachBeforeOpen(() => {
            // this.onChangeMyPageOnlyUnread();
          })
          .setModel(oMyPageModel)
          .bindElement('/');

        oView.addDependent(this.oMyPagePopover);

        this.showContentData();
      },

      async showContentData() {
        // const aContentData = await this.readContentData();
        // const { unreadCount, list, listCount } = this.transformContentData(aContentData);
        // const iUnreadCount = Math.min(unreadCount, 99);
        // const oNotificationModel = this.getNotificationModel();
        // oNotificationModel.setProperty('/showUnreadCount', unreadCount > 0);
        // oNotificationModel.setProperty('/unreadCount', `${unreadCount > 99 ? '+' : ''}${iUnreadCount}`);
        // oNotificationModel.setProperty('/listCount', listCount);
        // oNotificationModel.setProperty('/list', list);
      },

      async readContentData() {
        const oNotificationModel = this.getNotificationModel();
        const bOnlyUnread = oNotificationModel.getProperty('/onlyUnread');

        const oCommonModel = this.getController().getModel(ServiceNames.COMMON);
        const mFilters = {
          Mode: 'L',
          Unide: bOnlyUnread ? 'X' : '',
        };

        return Client.getEntitySet(oCommonModel, 'AlarmCenter', mFilters);
      },

      transformContentData(aContentData) {
        let iUnreadCount = 0;

        const sDTFMT = this.getController().getSessionProperty('DTFMT');
        aContentData.forEach((mData) => {
          delete mData.__metadata;

          mData.Menid = this.bMobile ? mData.MenidMobile : mData.MenidPc;
          mData.AdateFormatted = moment(mData.Adate).format(sDTFMT);

          if (mData.Checked !== 'X') {
            iUnreadCount += 1;
          }
        });

        return {
          list: aContentData,
          listCount: aContentData.length,
          unreadCount: iUnreadCount,
        };
      },

      async onChangeMobilePushOnOff(oEvent) {
        try {
          this.setBusy(true);

          // await this.showContentData();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      onPopoverToggle() {
        if (this.oMyPagePopover.isOpen()) {
          this.onPopoverClose();
        } else {
          this.oMyPagePopover.openBy(this.getController().byId('my-page'));
          this.setBusy(false);
        }
      },

      onPopoverClose() {
        this.oMyPagePopover.close();
      },

      getController() {
        return this.oController;
      },

      getMyPageModel() {
        return this.oMyPageModel;
      },

      setBusy(bBusy = true) {
        setTimeout(
          () => {
            this.getMyPageModel().setProperty('/busy', bBusy);
          },
          bBusy ? 0 : 500
        );
        return this;
      },
    });
  }
);
