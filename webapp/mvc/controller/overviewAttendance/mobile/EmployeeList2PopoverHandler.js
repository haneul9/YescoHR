sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/mobile/MobileEmployeeListPopoverHandler',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/overviewAttendance/mobile/EmployeeList5PopoverHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    MobileEmployeeListPopoverHandler,
    Client,
    ServiceNames,
    EmployeeList5PopoverHandler
  ) => {
    'use strict';

    /**
     * MSS > HR Boardroom > 근태현황 > 휴가 사용율 (Headty D)
     * MSS > HR Boardroom > 근태현황 > 조직별 연차사용율 (Headty E)
     * MSS > HR Boardroom > 근태현황 > 직급별 연차사용율 (Headty F)
     * MSS > HR Boardroom > 근태현황 > 월단위 연차사용율 추이 (Headty G)
     */
    return MobileEmployeeListPopoverHandler.extend('sap.ui.yesco.mvc.controller.overviewAttendance.mobile.EmployeeList2PopoverHandler', {
      init() {
        MobileEmployeeListPopoverHandler.prototype.init.call(this);

        this.oEmployeeList5PopupHandler = new EmployeeList5PopoverHandler(this.oController);
      },

      getPopoverFragmentName() {
        return 'sap.ui.yesco.mvc.view.overviewAttendance.mobile.EmployeeList2Popover';
      },

      setPropertiesForNavTo(oMenuModel) {
        this.bHasMssMenuAuth = oMenuModel.hasMssMenuAuth();
      },

      async onBeforeOpen() {
        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const mPayload = this.getPayloadData();

        const aEmployees = await Client.getEntitySet(oModel, 'TimeOverviewDetail2', mPayload);
        const sUnknownAvatarImageURL = AppUtils.getUnknownAvatarImageURL();

        this.setEmployeeList(
          aEmployees.map(({ Photo, Ename, Pernr, Zzjikgbtx, Zzjikchtx, Orgtx, Crecnt, Dedcnt, Balcnt, Plncnt, Begda, Endda }) => ({
            Photo: Photo || sUnknownAvatarImageURL,
            Ename,
            Pernr,
            Zzjikgbtx,
            Zzjikchtx,
            Orgtx,
            Crecnt: Crecnt || 0,
            Dedcnt: Dedcnt || 0,
            Balcnt: Balcnt || 0,
            Plncnt: Plncnt || 0,
            Begda,
            Endda,
            Navigable: this.bHasMssMenuAuth ? 'O' : '',
          }))
        );

        this.setBusy(false);
      },

      onAfterClose() {
        this.clearSearchFilter();
        this.clearTerms();
        this.clearEmployeeList();
      },

      onLiveChange(oEvent) {
        this.filterEmployeeList(oEvent);
      },

      navTo(oEvent) {
        if (!this.bHasMssMenuAuth) {
          return;
        }

        const sDiscod = this.getPayloadData().Discod;
        const sAwart = _.includes(['3', '4'], sDiscod) ? '2010' : '2000';
        const mPayload = (oEvent.getParameter('listItem') || oEvent.getSource()).getBindingContext().getProperty();

        this.oEmployeeList5PopupHandler.openPopover({ ..._.pick(mPayload, ['Pernr', 'Begda', 'Endda']), Awart: sAwart });
      },
    });
  }
);
