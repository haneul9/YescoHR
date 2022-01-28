sap.ui.define(
  [
    // prettier 방지용 주석
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
    Fragment,
    JSONModel,
    AppUtils,
    Debuggable,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.app.NotificationPopoverHandler', {
      bMobile: null,

      /**
       * @override
       */
      constructor: function (oController) {
        this.bMobile = AppUtils.isMobile();
        this.oController = oController;
        this.oNotificationModel = new JSONModel(this.getInitialData());

        this.init();
      },

      getInitialData() {
        return {
          busy: true,
          onlyUnread: false,
          list: [],
          listCount: 0,
          unreadCount: 0,
          showUnreadCount: false,
        };
      },

      async init() {
        this.oNotificationPopover = await Fragment.load({
          name: 'sap.ui.yesco.mvc.view.app.fragment.NotificationPopover',
          controller: this,
        });

        const oNotificationModel = this.getNotificationModel();

        this.oNotificationPopover
          .attachBeforeOpen(() => {
            this.onChangeNotificationOnlyUnread();
          })
          .attachAfterClose(() => {
            this.clearContentData();
          })
          .setModel(oNotificationModel)
          .bindElement('/');

        const oView = this.getController().getView();
        oView.setModel(oNotificationModel, 'notificationModel');
        oView.addDependent(this.oNotificationPopover);

        this.showContentData();
      },

      async showContentData() {
        const aContentData = await this.readContentData();
        const mContentData = this.transformContentData(aContentData);

        const iUnreadCount = Math.min(mContentData.unreadCount, 99);
        const oNotificationModel = this.getNotificationModel();
        oNotificationModel.setProperty('/list', mContentData.list);
        oNotificationModel.setProperty('/listCount', mContentData.listCount);
        oNotificationModel.setProperty('/unreadCount', `${iUnreadCount > 99 ? '+' : ''}${iUnreadCount}`);
        oNotificationModel.setProperty('/showUnreadCount', mContentData.unreadCount > 0);
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

        aContentData.forEach((mData) => {
          delete mData.__metadata;

          mData.Menid = this.bMobile ? mData.MenidMobile : mData.MenidPc;

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

      clearContentData() {
        const oNotificationModel = this.getNotificationModel();
        const iUnreadCount = oNotificationModel.getProperty('/unreadCount');
        const bShowUnreadCount = oNotificationModel.getProperty('/showUnreadCount');

        oNotificationModel.setData(this.getInitialData());
        oNotificationModel.setProperty('/unreadCount', iUnreadCount);
        oNotificationModel.setProperty('/showUnreadCount', bShowUnreadCount);
      },

      onUpdateStarted(oEvent) {
        this.debug(oEvent);
      },

      onUpdateFinished(oEvent) {
        this.debug(oEvent);
      },

      async onChangeNotificationOnlyUnread(oEvent) {
        if (oEvent) {
          oEvent.cancelBubble();
        }

        try {
          this.setBusy(true);

          await this.showContentData();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      async onPressNotificationPin(oEvent) {
        oEvent.cancelBubble();

        try {
          this.setBusy(true);

          const oContext = oEvent.getSource().getBindingContext();
          const oAdate = oContext.getProperty('Adate');
          const oAtime = oContext.getProperty('Atime');
          const sSeqnr = oContext.getProperty('Seqnr');
          const sPinned = oContext.getProperty('Pinned');

          const oCommonModel = this.getController().getModel(ServiceNames.COMMON);
          const mPayload = {
            Mode: sPinned === 'X' ? 'U' : 'P',
            Adate: oAdate,
            Atime: oAtime,
            Seqnr: sSeqnr,
          };

          await Client.create(oCommonModel, 'AlarmCenter', mPayload);

          await this.showContentData();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      onPressNotificationLink(oEvent) {
        oEvent.cancelBubble();

        this.getController().getAppMenu().handleMenuLink(oEvent);
      },

      async onPressNotificationReadToggle(oEvent) {
        oEvent.cancelBubble();

        try {
          this.setBusy(true);

          const oContext = oEvent.getSource().getBindingContext();
          const oAdate = oContext.getProperty('Adate');
          const oAtime = oContext.getProperty('Atime');
          const sSeqnr = oContext.getProperty('Seqnr');

          const oCommonModel = this.getController().getModel(ServiceNames.COMMON);
          const mPayload = {
            Mode: oEvent.getParameter('pressed') ? 'N' : 'C',
            Adate: oAdate,
            Atime: oAtime,
            Seqnr: sSeqnr,
          };

          await Client.create(oCommonModel, 'AlarmCenter', mPayload);

          await this.showContentData();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      async onPressAllNotificationRead() {
        try {
          this.setBusy(true);

          const oCommonModel = this.getController().getModel(ServiceNames.COMMON);
          const mPayload = {
            Mode: 'A',
          };

          await Client.create(oCommonModel, 'AlarmCenter', mPayload);

          await this.showContentData();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          this.setBusy(false);
        }
      },

      onPressNotificationOpenBy() {
        if (this.oNotificationPopover.isOpen()) {
          this.onPressNotificationClose();
        } else {
          this.oNotificationPopover.openBy(this.getController().byId('notification-bell'));
        }
      },

      onPressNotificationClose() {
        this.oNotificationPopover.close();
      },

      getController() {
        return this.oController;
      },

      getNotificationModel() {
        return this.oNotificationModel;
      },

      setBusy(bBusy = true) {
        setTimeout(
          () => {
            this.getNotificationModel().setProperty('/busy', bBusy);
          },
          bBusy ? 0 : 500
        );
        return this;
      },
    });
  }
);
