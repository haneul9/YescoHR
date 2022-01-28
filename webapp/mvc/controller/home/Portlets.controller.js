sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/f/dnd/GridDropInfo',
    'sap/ui/core/Fragment',
    'sap/ui/core/dnd/DragInfo',
    'sap/ui/core/dnd/DropLayout',
    'sap/ui/core/dnd/DropPosition',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/EmployeeSearch',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/home/PortletsP13nDialogHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P01PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P02PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P03PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P04PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P05PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P06PortletHandler',
  ],
  (
    // prettier 방지용 주석
    GridDropInfo,
    Fragment,
    DragInfo,
    DropLayout,
    DropPosition,
    JSONModel,
    AppUtils,
    EmployeeSearch,
    Client,
    ServiceNames,
    BaseController,
    PortletsP13nDialogHandler,
    P01PortletHandler,
    P02PortletHandler,
    P03PortletHandler,
    P04PortletHandler,
    P05PortletHandler,
    P06PortletHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.home.Portlets', {
      mPortletHandlers: {
        P01PortletHandler,
        P02PortletHandler,
        P03PortletHandler,
        P04PortletHandler,
        P05PortletHandler,
        P06PortletHandler,
      },

      EmployeeSearch: EmployeeSearch,

      onBeforeShow() {
        const oGrid = this.byId('portlets-grid');
        oGrid.destroyItems();

        oGrid.addDragDropConfig(
          new DragInfo({
            sourceAggregation: 'items',
            dragStart: this.onDragStart.bind(this),
          })
        );

        oGrid.addDragDropConfig(
          new GridDropInfo({
            targetAggregation: 'items',
            dropPosition: DropPosition.Between,
            dropLayout: DropLayout.Horizontal,
            drop: this.onDrop.bind(this),
            dragEnter: this.onDragEnter.bind(this),
          })
        );

        // Use smaller margin around grid when on smaller screens
        oGrid.attachLayoutChange((oEvent) => {
          const sLayout = oEvent.getParameter('layout');

          if (sLayout === 'layoutXS' || sLayout === 'layoutS') {
            oGrid.removeStyleClass('sapUiSmallMargin');
            oGrid.addStyleClass('sapUiTinyMargin');
          } else {
            oGrid.removeStyleClass('sapUiTinyMargin');
            oGrid.addStyleClass('sapUiSmallMargin');
          }
        });
      },

      onDragStart(oEvent) {
        const oPortlet = oEvent.getParameter('target');
        if (oPortlet && oPortlet.data('portlet-switchable') === false) {
          oEvent.preventDefault();
        }
      },

      onDragEnter(oEvent) {
        const oPortlet = oEvent.getParameter('target');
        if (oPortlet && oPortlet.data('portlet-switchable') === false) {
          oEvent.preventDefault();
        }
      },

      onDrop(oEvent) {
        const oGrid = oEvent.getSource().getParent();
        const oDropped = oEvent.getParameter('droppedControl');
        let iDropPosition = oGrid.indexOfItem(oDropped);
        if (iDropPosition === 0) {
          oEvent.preventDefault();
          return;
        }

        const oDragged = oEvent.getParameter('draggedControl');
        const iDragPosition = oGrid.indexOfItem(oDragged);
        const sInsertPosition = oEvent.getParameter('dropPosition');

        oGrid.removeItem(oDragged);

        if (iDragPosition < iDropPosition) {
          iDropPosition -= 1;
        }
        if (sInsertPosition === 'After') {
          iDropPosition += 1;
        }

        oGrid.insertItem(oDragged, iDropPosition);
        // oGrid.focusItem(iDropPosition);

        setTimeout(() => {
          this.onPressPortletsP13nSave();
        }, 300);
      },

      async onObjectMatched() {
        const mPortletsData = await this.readPortletsSetting();
        const oPortletsModel = await this.getPortletsModel(mPortletsData);

        this.setViewModel(oPortletsModel);

        this.oPortletsP13nDialogHandler = new PortletsP13nDialogHandler(this, oPortletsModel);

        this.showPortlets(oPortletsModel);
      },

      async readPortletsSetting() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const sUrl = 'PortletInfo';
        const mPayload = {
          Mode: 'R',
          PortletInfoTab1Set: [],
          PortletInfoTab2Set: [],
        };

        return Client.deep(oModel, sUrl, mPayload);
      },

      async getPortletsModel({ PortletInfoTab1Set = {}, PortletInfoTab2Set = {} }) {
        const aPortletInfoTab1Set = PortletInfoTab1Set.results || []; // Portlet 개별 세팅 정보
        const aPortletInfoTab2Set = PortletInfoTab2Set.results || []; // Portlet 개인화 정보

        // Portlet 개인화 정보
        const mPortletsP13nData = {};
        aPortletInfoTab2Set.map((o) => {
          delete o.__metadata;

          mPortletsP13nData[o.Potid] = o;
        });

        const mActivePortlets = {};
        const aActivePortlets = [];
        const mAllPortlets = {};
        const aAllPortlets = aPortletInfoTab1Set.map((o) => {
          delete o.__metadata;

          const mOriginal = $.extend(o, mPortletsP13nData[o.Potid]);
          const mPortletData = this.transform(mOriginal);

          mAllPortlets[o.Potid] = mPortletData;
          if (mPortletData.active) {
            aActivePortlets.push(mPortletData);
            mActivePortlets[o.Potid] = mPortletData;
          }

          return mPortletData;
        });

        return new JSONModel({
          available: aAllPortlets.length > 0,
          allMap: mAllPortlets,
          allList: aAllPortlets,
          activeList: aActivePortlets,
          activeMap: mActivePortlets,
          activeInstanceMap: {},
        });
      },

      transform(mPortletData) {
        return {
          busy: true,
          id: mPortletData.Potid,
          carousel: mPortletData.Mocat === 'A',
          position: {
            column: this.bMobile ? Number(mPortletData.MSeq) || 1 : Number(mPortletData.Colno) || 1,
            sequence: mPortletData.Zhide !== 'X' ? Number(mPortletData.Seqno) || 99 : 0,
          },
          width: Number(mPortletData.Hwidth) || 1,
          height: Number(mPortletData.Htall) || 1,
          borderless: mPortletData.Potid === 'P01',
          icon: mPortletData.Iconid,
          title: mPortletData.Potnm,
          tooltip: mPortletData.TooltipTx,
          url: this.bMobile ? mPortletData.LinkUrl2 : mPortletData.LinkUrl1,
          mid: this.bMobile ? mPortletData.LinkMenid2 : mPortletData.LinkMenid1,
          active: mPortletData.Zhide !== 'X',
          popup: mPortletData.Mepop === 'X',
          switchable: mPortletData.Fixed !== 'X',
          hideTitle: mPortletData.HideName === 'X',
          hasLink: !!(this.bMobile ? mPortletData.LinkUrl2 : mPortletData.LinkUrl1),
          original: mPortletData,
        };
      },

      async showPortlets(oPortletsModel) {
        const aActivePortlets = oPortletsModel.getProperty('/activeList');
        if (!aActivePortlets.length) {
          this.setPortletsNotFound(this.getBundleText('MSG_01901')); // 조회된 Portlet 정보가 없습니다.
          return;
        }

        const aActivateSuccesses = aActivePortlets // prettier 방지용 주석
          .sort((o1, o2) => o1.position.column * 100 + o1.position.sequence - (o2.position.column * 100 + o2.position.sequence))
          .map((mPortletData) => this.activatePortlet(mPortletData, oPortletsModel));

        if (aActivateSuccesses.every((bSuccess) => !bSuccess)) {
          this.setPortletsNotFound(this.getBundleText('MSG_01904')); // 개발자가 PortletHandler 로직 설정을 누락하였습니다.
        }
      },

      activatePortlet(mPortletData, oPortletsModel) {
        const PortletHandler = this.mPortletHandlers[`${mPortletData.id}PortletHandler`];
        if (!PortletHandler) {
          this.debug(`Portlets.controller > getPortletsModel > '${mPortletData.id}'에 해당하는 PortletHandler가 없습니다.`);
          return false;
        }

        oPortletsModel.setProperty(`/activeInstanceMap/${mPortletData.id}`, new PortletHandler(this, mPortletData));

        return true;
      },

      async setPortletsNotFound(message) {
        const oFragment = await Fragment.load({
          name: `sap.ui.yesco.mvc.view.home.fragment.PortletsNotFound`,
          controller: this,
        });

        oFragment.setModel(new JSONModel({ message }));

        this.byId('portlets-grid').addItem(oFragment);
      },

      getPortletItems() {
        return this.byId('portlets-grid').getItems();
      },

      /**
       * App.controller.js 에서 호출
       */
      onPressPortletsP13nDialogOpen() {
        this.oPortletsP13nDialogHandler.openPortletsP13nDialog();
      },

      async onPressPortletsP13nSave(sClosingPortletId) {
        return this.oPortletsP13nDialogHandler.onPressPortletsP13nSave(sClosingPortletId);
      },

      reduceViewResource() {
        this.byId('portlets-grid').destroyItems();
        this.getViewModel().destroy();
        this.oPortletsP13nDialogHandler.destroy();
        return this;
      },
    });
  }
);
