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
      EmployeeSearch: EmployeeSearch,

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

        const oPortletsModel = await this.getPortletsModel(mPortletsData);
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

        if (!aActivePortlets.length) {
          const oFragment = await Fragment.load({
            name: `sap.ui.yesco.mvc.view.home.fragment.PortletsNotFound`,
            controller: this,
          });

          this.byId('portlets-grid').addItem(oFragment);
        }

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
            column: this.bMobile ? Number(mPortletData.MSeq) || 1 : Number(mPortletData.Colno) || 1,
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

      /**
       * Portlet 설정 팝업 스위치 on/off 이벤트 처리
       * @param {sap.ui.base.Event} oEvent
       */
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

            const mPortletData = oPortletsModel.getProperty(`/allMap/${sPortletId}`);
            const aActiveList = oPortletsModel.getProperty('/activeList');
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

      /**
       * Portlet 개인화 정보 저장
       */
      async onPressPortletsP13nSave(sClosingPortletId) {
        try {
          // AppUtils.setAppBusy(true);

          const oPortletsModel = this.getViewModel();
          const mActivePortletsData = {};

          this.byId('portlets-grid')
            .getItems()
            .forEach((oPortlet) => {
              this.mapPortletPosition(oPortlet, mActivePortletsData, sClosingPortletId);
            });
          oPortletsModel.refresh();

          const aPortletData = oPortletsModel.getProperty('/allList').map((mPortletData) => {
            const mData = mActivePortletsData[mPortletData.id];
            if (mData) {
              return mData;
            }
            return this.getPortletPosition(mPortletData, -1);
          });

          const oModel = this.getModel(ServiceNames.COMMON);
          const sUrl = 'PortletInfo';
          const mPayload = {
            Mode: 'U',
            PortletInfoTab2Set: aPortletData,
          };
          return;

          await Client.create(oModel, sUrl, mPayload);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          // AppUtils.setAppBusy(false);
        }
      },

      /**
       * 활성화된 portlet 위치 정보 저장
       * @param {object} oPortlet 위치 정보를 추출할 portlet object
       * @param {map} mActivePortletsData 위치 정보가 저장될 map
       * @param {string} sClosingPortletId Portlet 닫기 버튼 클릭 또는 스위치 off로 비활성화될 portlet의 id
       */
      mapPortletPosition(oPortlet, mActivePortletsData, sClosingPortletId) {
        const oPortletModel = oPortlet.getModel();

        if (oPortletModel.getProperty('/multiPortlet')) {
          if (oPortletModel.getProperty('/orgMembers/active')) {
            const mPortletData = oPortletModel.getProperty('/orgMembers');
            if (mPortletData.id === sClosingPortletId) {
              return;
            }

            const iPortletCount = this.getPortletCount(mActivePortletsData);

            mActivePortletsData[mPortletData.id] = this.getPortletPosition(mPortletData, iPortletCount);
          }
          if (oPortletModel.getProperty('/myMembers/active')) {
            const mPortletData = oPortletModel.getProperty('/myMembers');
            if (mPortletData.id === sClosingPortletId) {
              return;
            }

            const iPortletCount = this.getPortletCount(mActivePortletsData);

            mActivePortletsData[mPortletData.id] = this.getPortletPosition(mPortletData, iPortletCount);
          }
        } else {
          const mPortletData = oPortletModel.getData();
          if (mPortletData.id === sClosingPortletId) {
            return;
          }

          const iPortletCount = this.getPortletCount(mActivePortletsData);

          mActivePortletsData[mPortletData.id] = this.getPortletPosition(mPortletData, iPortletCount);
        }
      },

      /**
       * Portlet 위치 정보 생성
       * @param {map} mPortletData
       * @param {int} iPortletCount
       * @returns
       */
      getPortletPosition(mPortletData, iPortletCount) {
        mPortletData.position.sequence = iPortletCount + 1;

        return {
          PCol: String(mPortletData.position.column || 1),
          PSeq: String(mPortletData.position.sequence).padStart(2, 0),
          Potid: mPortletData.id,
          Zhide: mPortletData.active ? '' : 'X',
        };
      },

      getPortletCount(mData) {
        return Object.keys(mData).length;
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
