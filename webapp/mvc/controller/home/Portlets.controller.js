sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/f/dnd/GridDropInfo',
    'sap/ui/core/Fragment',
    'sap/ui/core/dnd/DragInfo',
    'sap/ui/core/dnd/DropLayout',
    'sap/ui/core/dnd/DropPosition',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/home/PortletsP13nDialogHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/M21PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/M22PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/M23PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/M24PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P01PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P02PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P03PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P04PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P05PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P06PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P07PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P08PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P09PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P10PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P11PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P12PortletHandler',
  ],
  (
    // prettier 방지용 주석
    GridDropInfo,
    Fragment,
    DragInfo,
    DropLayout,
    DropPosition,
    JSONModel,
    Client,
    ServiceNames,
    BaseController,
    PortletsP13nDialogHandler,
    M21PortletHandler,
    M22PortletHandler,
    M23PortletHandler,
    M24PortletHandler,
    P01PortletHandler,
    P02PortletHandler,
    P03PortletHandler,
    P04PortletHandler,
    P05PortletHandler,
    P06PortletHandler,
    P07PortletHandler,
    P08PortletHandler,
    P09PortletHandler,
    P10PortletHandler,
    P11PortletHandler,
    P12PortletHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.home.Portlets', {
      mPortletKeys: {
        // 임원용
        M01: 'P01',
        M02: 'P02',
        M03: 'P03',
        M04: 'P04',
        M05: 'P05',
        M06: 'P06',
        M07: 'P07',
        M08: 'P08',
        M09: 'P09',
        M12: 'P12',
        M21: 'M21',
        M22: 'M22',
        M23: 'M23',
        M24: 'M24',
        // 직원용
        P01: 'P01',
        P02: 'P02',
        P03: 'P03',
        P04: 'P04',
        P05: 'P05',
        P06: 'P06',
        P07: 'P07',
        P08: 'P08',
        P09: 'P09',
        P10: 'P10',
        P11: 'P11',
        P12: 'P12',
      },
      mPortletHandlers: {
        // 임원용
        M01: P01PortletHandler,
        M02: P02PortletHandler,
        M03: P03PortletHandler,
        M04: P04PortletHandler,
        M05: P05PortletHandler,
        M06: P06PortletHandler,
        M07: P07PortletHandler,
        M08: P08PortletHandler,
        M09: P09PortletHandler,
        M12: P12PortletHandler,
        M21: M21PortletHandler,
        M22: M22PortletHandler,
        M23: M23PortletHandler,
        M24: M24PortletHandler,
        // 직원용
        P01: P01PortletHandler,
        P02: P02PortletHandler,
        P03: P03PortletHandler,
        P04: P04PortletHandler,
        P05: P05PortletHandler,
        P06: P06PortletHandler,
        P07: P07PortletHandler,
        P08: P08PortletHandler,
        P09: P09PortletHandler,
        P10: P10PortletHandler,
        P11: P11PortletHandler,
        P12: P12PortletHandler,
      },

      onInit() {
        BaseController.prototype.onInit.apply(this);

        const oGrid = this.byId('portlets-grid');
        oGrid.destroyItems();

        if (this.bMobile) {
          return;
        }

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
        const oDraggedPortlet = oEvent.getParameter('target');

        // 위치 고정 portlet을 drag할 때
        if (oDraggedPortlet && oDraggedPortlet.data('portlet-switchable') === false) {
          oEvent.preventDefault();
        }
      },

      onDragEnter(oEvent) {
        const oDroppedPortlet = oEvent.getParameter('target');

        // 위치 고정 portlet에 drag 중인 portlet을 올려놓을 때
        if (oDroppedPortlet && oDroppedPortlet.data('portlet-switchable') === false) {
          // oEvent.preventDefault(); // preventDefault를 해버리면 drag event 자체가 비활성화되면서 다른 위치에 drop도 할 수 없게됨
          return;
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

        setTimeout(() => {
          const sPortletId = oDragged.getBindingContext().getProperty('id');
          const oPortletHandler = this.getViewModel().getProperty(`/activeInstanceMap/${sPortletId}`);
          if (oPortletHandler) {
            oPortletHandler.onAfterDragAndDrop();
          }
        });
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
          Mode: this.bMobile ? 'M' : 'R',
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
        const sPortletKey = this.mPortletKeys[mPortletData.Potid];
        return {
          busy: true,
          id: mPortletData.Potid,
          key: sPortletKey,
          carousel: mPortletData.Mocat === 'A',
          position: {
            column: this.bMobile ? Number(mPortletData.MSeq) || 1 : Number(mPortletData.Colno) || 1,
            sequence: mPortletData.Zhide !== 'X' ? Number(mPortletData.Seqno) || 99 : 0,
          },
          width: Number(mPortletData.Hwidth) || 1,
          height: Number(mPortletData.Htall) || 1,
          borderless: sPortletKey === 'P01',
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
        const PortletHandler = this.mPortletHandlers[mPortletData.id];
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
