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
    'sap/ui/yesco/mvc/controller/home/portlets/P01PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P02PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P03PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P04PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P05PortletHandler',
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
    P01PortletHandler,
    P02PortletHandler,
    P03PortletHandler,
    P04PortletHandler,
    P05PortletHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.home.Portlets', {
      EmployeeSearch,

      bMobile: false,
      mPortletHandlers: {
        P01: P01PortletHandler,
        P02: P02PortletHandler,
        P03: P03PortletHandler,
        P04: P04PortletHandler,
        P05: P05PortletHandler,
      },

      onBeforeShow() {
        const oGrid = this.byId('portlets-grid');

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
        if (oPortlet.data('portlet-id') === 'P01') {
          oEvent.preventDefault();
        }
      },

      onDragEnter(oEvent) {
        const oPortlet = oEvent.getParameter('target');
        if (oPortlet && oPortlet.data('portlet-id') === 'P01') {
          oEvent.preventDefault();
        }
      },

      onDrop(oEvent) {
        const oGrid = oEvent.getSource().getParent();
        const oDragged = oEvent.getParameter('draggedControl');
        const oDropped = oEvent.getParameter('droppedControl');
        const sInsertPosition = oEvent.getParameter('dropPosition');
        const iDragPosition = oGrid.indexOfItem(oDragged);
        let iDropPosition = oGrid.indexOfItem(oDropped);

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

        const oPortletsModel = this.getPortletsModel(mPortletsData);
        this.setViewModel(oPortletsModel);

        this.oPortletsP13nDialog = await Fragment.load({
          name: 'sap.ui.yesco.mvc.view.home.fragment.PortletsP13nDialog',
          controller: this,
        });

        this.oPortletsP13nDialog
          .attachAfterClose(() => {
            this.onPressPortletsP13nSave();
          })
          .addStyleClass(this.getOwnerComponent().getContentDensityClass());

        this.getView().addDependent(this.oPortletsP13nDialog);
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

      getPortletsModel({ PortletInfoTab1Set = {}, PortletInfoTab2Set = {} }) {
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

        const mActivePortletInstances = {};
        aActivePortlets
          .sort((o1, o2) => o1.position.column * 100 + o1.position.sequence - (o2.position.column * 100 + o2.position.sequence))
          .forEach((mPortletData) => {
            setTimeout(() => {
              const PortletHandler = this.mPortletHandlers[mPortletData.id];
              if (!PortletHandler) {
                this.debug(`Portlets.controller > getPortletsModel > '${mPortletData.id}'에 해당하는 PortletHandler가 없습니다.`);
                return mPortletData;
              }

              mActivePortletInstances[mPortletData.id] = new PortletHandler(this, mPortletData);
            });
          });

        return new JSONModel({
          available: aAllPortlets.length > 0,
          allMap: mAllPortlets,
          allList: aAllPortlets,
          activeList: aActivePortlets,
          activeMap: mActivePortlets,
          activeInstanceMap: mActivePortletInstances,
        });
      },

      transform(mPortletData) {
        return {
          original: mPortletData,
          id: mPortletData.Potid,
          carousel: mPortletData.Mocat === 'A',
          position: {
            column: this.bMobile ? Number(mPortletData.MSeq) || 0 : Number(mPortletData.Colno) || 0,
            sequence: Number(mPortletData.Seqno) || 0,
          },
          height: Number(mPortletData.Htall) || 1,
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
        };
      },

      onSelectPortletSwitch(oEvent) {
        const bSelected = oEvent.getParameter('selected');
        const sPortletId = oEvent.getSource().getBindingContext().getProperty('id');
        const oPortletsModel = this.getViewModel();

        oPortletsModel.setProperty('/busy', true);

        setTimeout(() => {
          if (bSelected) {
            const PortletHandler = this.mPortletHandlers[sPortletId];
            if (!PortletHandler) {
              this.debug(`Portlets.controller > onSelectPortletSwitch > '${sPortletId}'에 해당하는 PortletHandler가 없습니다.`);
              return;
            }

            const aActiveList = oPortletsModel.getProperty('/activeList');
            const mPortletData = oPortletsModel.getProperty(`/allMap/${sPortletId}`);

            aActiveList.push(mPortletData);

            oPortletsModel.setProperty(`/allMap/${sPortletId}/active`, true);
            oPortletsModel.setProperty(`/allMap/${sPortletId}/position/column`, 1);
            oPortletsModel.setProperty(`/allMap/${sPortletId}/position/sequence`, aActiveList.length + 1);
            oPortletsModel.setProperty(`/activeMap/${sPortletId}`, mPortletData);
            oPortletsModel.setProperty(`/activeInstanceMap/${sPortletId}`, new PortletHandler(this, mPortletData));
          } else {
            oPortletsModel.getProperty(`/activeInstanceMap`)[sPortletId].destroy();
          }

          oPortletsModel.refresh();
          oPortletsModel.setProperty('/busy', false);
        });
      },

      /**
       * App.controller.js 에서 호출
       */
      onPressPortletsP13nDialogOpen() {
        this.oPortletsP13nDialog.open();
      },

      onPressPortletsP13nDialogClose() {
        this.oPortletsP13nDialog.close();
      },

      async onPressPortletsP13nSave() {
        try {
          // AppUtils.setAppBusy(true);

          const aAllList = oPortletsModel.getProperty('/allList');
          const aActiveList = [];
          this.byId('portlets-grid')
            .getItems()
            .forEach((oPortlet) => {
              this.appendPortletPosition({ aActiveList, oPortlet });
            });
          this.getViewModel().refresh();

          const oModel = this.getModel(ServiceNames.COMMON);
          const sUrl = 'PortletInfo';
          const mPayload = {
            Mode: 'U',
            PortletInfoTab2Set: aActiveList,
          };

          await Client.create(oModel, sUrl, mPayload);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          // AppUtils.setAppBusy(false);
        }
      },

      appendPortletPosition({ aActiveList, oPortlet }) {
        const oPortletModel = oPortlet.getModel();

        if (oPortletModel.getProperty('/multiPortlet')) {
          if (oPortletModel.getProperty('/orgMembers/active')) {
            aActiveList.push(this.getPortletPosition(oPortletModel.getProperty('/orgMembers'), aActiveList.length));
          }
          if (oPortletModel.getProperty('/myMembers/active')) {
            aActiveList.push(this.getPortletPosition(oPortletModel.getProperty('/myMembers'), aActiveList.length));
          }
        } else {
          aActiveList.push(this.getPortletPosition(oPortletModel.getData(), aActiveList.length));
        }
      },

      getPortletPosition(mPortletData, i) {
        mPortletData.position.sequence = i + 1;

        return {
          PCol: String(mPortletData.position.column),
          PSeq: String(mPortletData.position.sequence).padStart(2, 0),
          Potid: mPortletData.id,
          Zhide: mPortletData.active ? '' : 'X',
        };
      },

      reduceViewResource() {
        this.byId('portlets-grid').destroyItems();
        this.getViewModel().destroy();
        this.getView().removeDependent(this.oPortletsP13nDialog);
        this.oPortletsP13nDialog.destroy();
        return this;
      },
    });
  }
);
