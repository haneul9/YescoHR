sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/f/dnd/GridDropInfo',
    'sap/ui/core/Fragment',
    'sap/ui/core/dnd/DragInfo',
    'sap/ui/core/dnd/DropLayout',
    'sap/ui/core/dnd/DropPosition',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/EmployeeSearch',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/home/portlets/P01PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P02PortletHandler',
    'sap/ui/yesco/mvc/controller/home/portlets/P03PortletHandler',
  ],
  (
    // prettier 방지용 주석
    GridDropInfo,
    Fragment,
    DragInfo,
    DropLayout,
    DropPosition,
    JSONModel,
    EmployeeSearch,
    Client,
    ServiceNames,
    BaseController,
    P01PortletHandler,
    P02PortletHandler,
    P03PortletHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.home.Portlets', {
      EmployeeSearch,

      bMobile: false,
      mPortletHandlers: {
        P01: P01PortletHandler,
        P02: P02PortletHandler,
        P03: P03PortletHandler,
      },
      mPortletHandlerInstances: {},

      onBeforeShow() {
        const oGrid = this.byId('portlets-grid');

        oGrid.addDragDropConfig(
          new DragInfo({
            sourceAggregation: 'items',
            dragStart: this.onDragStart,
          })
        );

        oGrid.addDragDropConfig(
          new GridDropInfo({
            targetAggregation: 'items',
            dropPosition: DropPosition.Between,
            dropLayout: DropLayout.Horizontal,
            drop: this.onDrop,
            dragEnter: this.onDragEnter,
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
          iDropPosition--;
        }

        if (sInsertPosition === 'After') {
          iDropPosition++;
        }

        oGrid.insertItem(oDragged, iDropPosition);
        // oGrid.focusItem(iDropPosition);
      },

      async onObjectMatched() {
        const mPortletsData = await this.readPortletsSetting();

        // this.setTestData(mPortletsData);

        const oPortletsModel = this.getPortletsModel(mPortletsData);
        this.setViewModel(oPortletsModel);

        this.oPortletsP13nDialog = await Fragment.load({
          name: 'sap.ui.yesco.mvc.view.home.fragment.PortletsP13nDialog',
          controller: this,
        });

        this.oPortletsP13nDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());

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

        const mActivePortletInstances = {};
        const mActivePortlets = {};
        const aActivePortlets = [];
        const mAllPortlets = {};
        const aAllPortlets = aPortletInfoTab1Set
          .map((o) => {
            delete o.__metadata;

            const mOriginal = $.extend(o, mPortletsP13nData[o.Potid]);
            const mPortletData = this.transform(mOriginal);
            mAllPortlets[o.Potid] = mPortletData;

            if (mPortletData.active) {
              const PortletHandler = this.mPortletHandlers[o.Potid];
              if (!PortletHandler) {
                this.debug(`Portlets.controller > getPortletsModel > '${o.Potid}'에 해당하는 PortletHandler가 없습니다.`);
                return mPortletData;
              }

              aActivePortlets.push(mPortletData);
              mActivePortlets[o.Potid] = mPortletData;

              setTimeout(() => {
                mActivePortletInstances[o.Potid] = new PortletHandler(this, mPortletData);
              });
            }

            return mPortletData;
          })
          .sort((o1, o2) => o1.position.column * 100 + o1.position.sequence - (o2.position.column * 100 + o2.position.sequence));

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
        const oBindingContext = oEvent.getSource().getBindingContext();
        const oPortletsModel = oBindingContext.getModel();
        const sPortletId = oBindingContext.getProperty('id');

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

            oPortletsModel.setProperty(`/allMap/${sPortletId}/position/column`, 1);
            oPortletsModel.setProperty(`/allMap/${sPortletId}/position/sequence`, aActiveList.length + 1);
            oPortletsModel.setProperty(`/activeMap/${sPortletId}`, mPortletData);
            oPortletsModel.setProperty(`/activeInstanceMap/${sPortletId}`, new PortletHandler(this, mPortletData));
          } else {
            oPortletsModel.setProperty(`/allMap/${sPortletId}/position/column`, 0);
            oPortletsModel.setProperty(`/allMap/${sPortletId}/position/sequence`, 0);
            oPortletsModel.getProperty(`/activeInstanceMap/${sPortletId}`).destroy();
            _.remove(oPortletsModel.getProperty('/activeList'), (mPortletData) => {
              return mPortletData.id === sPortletId;
            });
            delete oPortletsModel.getProperty(`/activeMap/${sPortletId}`);
            delete oPortletsModel.getProperty(`/activeInstanceMap/${sPortletId}`);
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
        const oModel = this.getModel(ServiceNames.COMMON);
        const sUrl = 'PortletInfo';
        const mPayload = {
          Mode: 'U',
          PortletInfoTab2Set: [],
        };

        return Client.create(oModel, sUrl, mPayload);
      },

      reduceViewResource() {
        this.byId('portlets-grid').destroyItems();
        this.setViewModel(null);
        this.getView().removeDependent(this.oPortletsP13nDialog);
        this.oPortletsP13nDialog.destroy();
        return this;
      },

      setTestData(mPortletsData) {
        mPortletsData.PortletInfoTab1Set = {
          results: [
            {
              Potid: 'P01',
              Potnm: '테스트 1',
              Odataid: '',
              Colno: '1',
              Seqno: '01',
              Htall: '1',
              Fixed: '',
              HideName: '',
              Mocat: '',
              MSeq: '',
              Iconid: '',
              LinkUrl1: '',
              LinkMenid1: '',
              LinkUrl2: '',
              LinkMenid2: '',
              TooltipTx: '툴팁 1 입니다.',
              Mepop: '',
            },
            {
              Potid: 'P02',
              Potnm: '테스트 2',
              Odataid: '',
              Colno: '1',
              Seqno: '02',
              Htall: '1',
              Fixed: '',
              HideName: '',
              Mocat: '',
              MSeq: '',
              Iconid: '',
              LinkUrl1: '',
              LinkMenid1: '',
              LinkUrl2: '',
              LinkMenid2: '',
              TooltipTx: '툴팁 2 입니다.',
              Mepop: '',
            },
            {
              Potid: 'P03',
              Potnm: '테스트 3',
              Odataid: '',
              Colno: '1',
              Seqno: '03',
              Htall: '1',
              Fixed: '',
              HideName: '',
              Mocat: '',
              MSeq: '',
              Iconid: '',
              LinkUrl1: '',
              LinkMenid1: '',
              LinkUrl2: '',
              LinkMenid2: '',
              TooltipTx: '툴팁 3 입니다.',
              Mepop: '',
            },
            {
              Potid: 'P04',
              Potnm: '테스트 4',
              Odataid: '',
              Colno: '1',
              Seqno: '04',
              Htall: '1',
              Fixed: '',
              HideName: '',
              Mocat: '',
              MSeq: '',
              Iconid: '',
              LinkUrl1: '',
              LinkMenid1: '',
              LinkUrl2: '',
              LinkMenid2: '',
              TooltipTx: '툴팁 4 입니다.',
              Mepop: '',
            },
            {
              Potid: 'P05',
              Potnm: '테스트 5',
              Odataid: '',
              Colno: '1',
              Seqno: '05',
              Htall: '1',
              Fixed: '',
              HideName: '',
              Mocat: '',
              MSeq: '',
              Iconid: '',
              LinkUrl1: '',
              LinkMenid1: '',
              LinkUrl2: '',
              LinkMenid2: '',
              TooltipTx: '툴팁 5 입니다.',
              Mepop: '',
            },
          ],
        };
        mPortletsData.PortletInfoTab2Set = {
          results: [
            {
              Potid: 'P01',
              PCol: '1',
              PSeq: '01',
              Zhide: '',
            },
            {
              Potid: 'P02',
              PCol: '1',
              PSeq: '02',
              Zhide: '',
            },
            {
              Potid: 'P03',
              PCol: '1',
              PSeq: '03',
              Zhide: 'X',
            },
            {
              Potid: 'P04',
              PCol: '1',
              PSeq: '04',
              Zhide: '',
            },
            {
              Potid: 'P05',
              PCol: '1',
              PSeq: '05',
              Zhide: '',
            },
          ],
        };
      },
    });
  }
);
