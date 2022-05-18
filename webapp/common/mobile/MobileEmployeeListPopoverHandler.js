sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    AppUtils,
    Debuggable
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.common.mobile.MobileEmployeeListPopoverHandler', {
      constructor: function (oController) {
        this.oController = oController;
        this.oPopoverModel = new JSONModel(this.getInitialData());
        this.oPopoverModel.setSizeLimit(10000);

        this.init();
      },

      getInitialData() {
        return {
          popover: {
            busy: true,
            resizable: true,
            terms: null,
            employees: null,
          },
        };
      },

      async init() {
        const oMenuModel = AppUtils.getAppComponent().getMenuModel();
        await oMenuModel.getPromise();

        this.setPropertiesForNavTo(oMenuModel);

        const oView = this.oController.getView();

        this.oPopover = await Fragment.load({
          id: oView.getId(),
          name: this.getPopoverFragmentName(),
          controller: this,
        });

        this.oPopover
          .attachBeforeOpen(() => {
            this.onBeforeOpen();
          })
          .attachAfterOpen(() => {
            setTimeout(() => {
              AppUtils.getAppComponent().registerPopover(this.oPopover);
            });
          })
          .attachBeforeClose(() => {})
          .attachAfterClose(() => {
            setTimeout(() => {
              this.onAfterClose();
            });
          })
          .setModel(this.oPopoverModel)
          .bindElement('/popover');

        oView.addDependent(this.oPopover);
      },

      /**
       * @abstract
       */
      getPopoverFragmentName() {},

      /**
       * @abstract
       * @param {sap.ui.yesco.mvc.model.MenuModel} oMenuModel
       */
      setPropertiesForNavTo(oMenuModel) {},

      /**
       * @abstract
       */
      onBeforeOpen() {},

      /**
       * @abstract
       */
      onAfterClose() {},

      /**
       * @abstract
       * @param {sap.ui.base.Event} oEvent
       */
      onLiveChange(oEvent) {},

      /**
       * @abstract
       * @param {sap.ui.base.Event | object} oParam
       */
      openPopover(oParam) {
        this.setBusy();

        let mPayloadData, oEventSource;
        if (oParam instanceof sap.ui.base.Event) {
          // Portlet 같은 곳에서 Headty, Discod 만 넘어오는 경우
          oEventSource = oParam.getSource();
          mPayloadData = this.transformEventSourceDataToPayload(oEventSource.data());
        } else {
          // MSS 인원현황 메뉴 같은 곳에서 oParam에 검색 조건이 모두 포함되어 넘어오는 경우
          oEventSource = AppUtils.getAppController().byId('mobile-basis-home');
          mPayloadData = oParam;
        }

        this.setPayloadData(mPayloadData);

        this.oPopover.openBy(oEventSource);
      },

      transformEventSourceDataToPayload(mEventSourceData) {
        const mAppointeeData = this.oController.getAppointeeData();
        if (mEventSourceData.OData === 'H') {
          return {
            Zyear: moment().year(),
            Werks: mAppointeeData.Werks,
            Orgeh: mAppointeeData.Orgeh,
            Headty: mEventSourceData.Headty,
            Discod: mEventSourceData.Discod,
          };
        } else if (mEventSourceData.OData === 'T') {
          return {
            Datum: moment().startOf('date').add(9, 'hours'),
            Werks: mAppointeeData.Werks,
            Orgeh: mAppointeeData.Orgeh,
            Headty: mEventSourceData.Headty,
            Discod: mEventSourceData.Discod,
          };
        }
      },

      setPayloadFromData() {},

      closePopover(oEvent) {
        oEvent.stopImmediatePropagation();
        this.oPopover.close();
      },

      setPayloadData(mPayloadData) {
        this.mPayloadData = mPayloadData;
      },

      getPayloadData() {
        return this.mPayloadData;
      },

      setSearchFilter(aFilters) {
        this.oPopover.getContent()[1].getContent()[0].getBinding('items').filter(aFilters);
      },

      setTerms(sTerms) {
        this.oPopoverModel.setProperty('/popover/terms', sTerms);
      },

      setEmployeeList(aEmployeeList) {
        this.oPopoverModel.setProperty('/popover/employees', aEmployeeList);
      },

      clearSearchFilter() {
        this.setSearchFilter([]);
      },

      clearTerms() {
        this.setTerms(null);
      },

      clearEmployeeList() {
        this.setEmployeeList([]);
      },

      togglePopover(oEvent) {
        if (this.oPopover.isOpen()) {
          this.closePopover();
        } else {
          this.oPopover.openBy(oEvent.getSource());
          this.setBusy(false);
        }
      },

      setBusy(bBusy = true) {
        setTimeout(
          () => {
            this.oPopoverModel.setProperty('/popover/busy', bBusy);
          },
          bBusy ? 0 : 500
        );
        return this;
      },

      destroy() {
        this.oPopover.destroy();
        this.oPopoverModel.destroy();
      },
    });
  }
);
