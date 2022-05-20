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
        this.oAppMenu = AppUtils.getAppController().getAppMenu();
        this.oMenuModel = AppUtils.getAppComponent().getMenuModel();
        await this.oMenuModel.getPromise();

        this.setPropertiesForNavTo(this.oMenuModel);

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

        if (mPayloadData.OData) {
          delete mPayloadData.OData;
        }

        this.setPayloadData(mPayloadData);

        this.oPopover.openBy(oEventSource);
      },

      transformEventSourceDataToPayload(mEventSourceData) {
        const mAppointeeData = this.oController.getAppointeeData();
        const mPayload = {
          Werks: mAppointeeData.Werks,
          Orgeh: mAppointeeData.Orgeh,
          Headty: mEventSourceData.Headty,
          Discod: mEventSourceData.Discod,
        };
        if (mEventSourceData.OData === 'H') {
          mPayload.Zyear = moment().year();
        } else if (mEventSourceData.OData === 'T') {
          mPayload.Datum = moment().startOf('date').add(9, 'hours');
        }
        return mPayload;
      },

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

      filterEmployeeList(oEvent) {
        const sValue = $.trim(oEvent.getParameter('newValue'));
        if (!sValue) {
          this.clearSearchFilter();
          return;
        }

        const aFilters = new Filter({
          filters: [
            new Filter('Ename', FilterOperator.Contains, sValue), //
            new Filter('Pernr', FilterOperator.Contains, sValue),
          ],
          and: false,
        });

        this.setSearchFilter(aFilters);
      },

      togglePopover(oEvent) {
        if (this.oPopover.isOpen()) {
          this.closePopover();
        } else {
          this.oPopover.openBy(oEvent.getSource());
          this.setBusy(false);
        }
      },

      /**
       * 개인별근태현황 icon touch event handler
       * @param {sap.ui.base.Event} oEvent
       */
      onPressAttendanceLinkIcon(oEvent) {
        if (!this.oMenuModel.hasMssMenuAuth()) {
          return;
        }

        const mRowData = (oEvent.getParameter('listItem') || oEvent.getSource()).getBindingContext().getProperty();
        const sPernr = mRowData.Pernr;
        const oDatum = mRowData.Datum || mRowData.Tmdat ? moment(mRowData.Datum || mRowData.Tmdat) : moment();

        this.oAppMenu.moveToMenu('mobile/individualWorkState', { pernr: sPernr, year: oDatum.year(), month: oDatum.month() });
      },

      /**
       * 사원 프로파일 icon touch event handler
       * @param {sap.ui.base.Event} oEvent
       */
      onPressProfileLinkIcon(oEvent) {
        if (!this.oMenuModel.hasEmployeeProfileViewAuth()) {
          return;
        }

        const sProfileMenuUrl = this.oMenuModel.getEmployeeProfileMenuUrl();
        const sPernr = (oEvent.getParameter('listItem') || oEvent.getSource()).getBindingContext().getProperty('Pernr');

        this.oAppMenu.moveToMenu(sProfileMenuUrl, { pernr: sPernr });
      },

      /**
       * 검색 icon touch event handler
       * @param {sap.ui.base.Event} oEvent
       */
      onPressSearchLinkIcon(oEvent) {},

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
