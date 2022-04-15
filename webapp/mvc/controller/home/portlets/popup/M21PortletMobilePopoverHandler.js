sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    AppUtils,
    Debuggable,
    Client,
    ServiceNames
  ) => {
    'use strict';

    /**
     * 인원 현황 Portlet (임원용) Mobile Dialog Handler
     */
    return Debuggable.extend('sap.ui.yesco.mvc.controller.home.portlets.popup.M21PortletMobilePopoverHandler', {
      /**
       * @override
       */
      constructor: function (oController, oPortletModel) {
        this.oController = oController;
        this.oPortletModel = oPortletModel;

        this.init();
      },

      async init() {
        const oView = this.oController.getView();

        this.oPopover = await Fragment.load({
          id: oView.getId(),
          name: 'sap.ui.yesco.mvc.view.app.fragment.MobileEmployeeSearchPopover',
          controller: this,
        });

        this.oPortletModel.setProperty('/popover', { busy: true, linkType: 'M', employees: null });

        this.oPopover
          .attachAfterOpen(() => {
            setTimeout(() => {
              $('#sap-ui-blocklayer-popup')
                .off('click')
                .on('click', () => {
                  this.closePopover();
                });
            }, 100);
          })
          .attachBeforeClose(() => {
            setTimeout(() => {
              $('#sap-ui-blocklayer-popup').off('click');
            });
          })
          .attachAfterClose(() => {
            setTimeout(() => {
              this.oPopover.getContent()[1].getContent()[0].getBinding('items').filter([]);
              this.oPortletModel.setProperty('/popover/employees', []);
            });
          })
          .setModel(this.oPortletModel)
          .bindElement('/popover');

        oView.addDependent(this.oPopover);
      },

      onLiveChange(oEvent) {
        const sValue = $.trim(oEvent.getParameter('newValue'));
        if (!sValue) {
          this.oPopover.getContent()[1].getContent()[0].getBinding('items').filter([]);
          return;
        }

        const aFilters = new Filter({
          filters: [
            new Filter('Ename', FilterOperator.Contains, sValue), //
            new Filter('Pernr', FilterOperator.Contains, sValue),
          ],
          and: false,
        });

        this.oPopover.getContent()[1].getContent()[0].getBinding('items').filter(aFilters);
      },

      async openDialog(oEvent) {
        try {
          const oEventSource = oEvent.getSource();
          setTimeout(() => {
            this.oPortletModel.setProperty('/popover/busy', true);
            this.oPopover.openBy(oEventSource);
          });

          const oSessionModel = this.oController.getSessionModel();
          const mPayload = {
            Zyear: moment().year(),
            Werks: oSessionModel.getProperty('/Werks'),
            Orgeh: oSessionModel.getProperty('/Orgeh'),
            Headty: 'A',
            Discod: oEventSource.data('Discod'),
          };
          const aDetailData = await Client.getEntitySet(this.oController.getModel(ServiceNames.PA), 'HeadCountDetail', mPayload);

          this.oPortletModel.setProperty(
            '/popover/employees',
            aDetailData.map(({ Photo, Ename, Pernr, Zzjikgbtx, Zzjikchtx, Orgtx }) => ({ Photo, Ename, Pernr, Zzjikcht: Zzjikgbtx, Zzjikgbt: Zzjikchtx, Fulln: Orgtx, linkType: 'M' }))
          );
        } catch (oError) {
          this.oController.debug('M21PortletMobilePopoverHandler > openDialog Error', oError);

          AppUtils.handleError(oError, {
            onClose: () => this.oPopover.close(),
          });
        } finally {
          this.oPortletModel.setProperty('/popover/busy', false);
        }
      },

      closePopover() {
        this.oPopover.close();
      },

      navToProfile(oEvent) {
        const sPernr = oEvent.getSource().getBindingContext().getProperty('Pernr');
        this.oController.reduceViewResource().getRouter().navTo('mobile/m/employee-detail', { pernr: sPernr });
      },

      setBusy(bBusy = true) {
        setTimeout(
          () => {
            this.oPortletModel.setProperty('/popover/busy', bBusy);
          },
          bBusy ? 0 : 500
        );
        return this;
      },

      destroy() {
        this.oPopover.destroy();
      },
    });
  }
);
