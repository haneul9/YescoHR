sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Debuggable,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.home.PortletsP13nDialogHandler', {
      /**
       * @override
       */
      constructor: function (oController, oPortletsModel) {
        this.oController = oController;
        this.oPortletsModel = oPortletsModel;

        this.init();
      },

      async init() {
        this.oPortletsP13nDialog = await Fragment.load({
          name: 'sap.ui.yesco.mvc.view.home.fragment.PortletsP13nDialog',
          controller: this,
        });

        this.oPortletsP13nDialog
          .attachAfterClose(() => {
            this.onPressPortletsP13nSave();
          })
          .setModel(this.getPortletsModel());

        this.getController().getView().addDependent(this.oPortletsP13nDialog);
      },

      /**
       * Portlet 개인화 설정 팝업 스위치 on/off 이벤트 처리
       * @param {sap.ui.base.Event} oEvent
       */
      onSelectPortletSwitch(oEvent) {
        const bSelected = oEvent.getParameter('selected');
        const sPortletId = oEvent.getSource().getBindingContext().getProperty('id');
        const oController = this.getController();
        const oPortletsModel = this.getPortletsModel();

        setTimeout(() => {
          oPortletsModel.setProperty('/busy', true);
        });

        if (bSelected) {
          this.debug(`PortletsP13nDialogHandler.onSelectPortletSwitch On ${sPortletId}`, oEvent);

          const mPortletData = oPortletsModel.getProperty(`/allMap/${sPortletId}`);

          if (!oController.activatePortlet(mPortletData, oPortletsModel)) {
            return;
          }

          const aActiveList = oPortletsModel.getProperty('/activeList');
          aActiveList.push(mPortletData);

          oPortletsModel.setProperty(`/allMap/${sPortletId}/active`, true);
          oPortletsModel.setProperty(`/allMap/${sPortletId}/position/column`, 1);
          oPortletsModel.setProperty(`/allMap/${sPortletId}/position/sequence`, aActiveList.length + 1);
          oPortletsModel.setProperty(`/activeMap/${sPortletId}`, mPortletData);
        } else {
          this.debug(`PortletsP13nDialogHandler.onSelectPortletSwitch Off ${sPortletId}`, oEvent);

          oPortletsModel.getProperty(`/activeInstanceMap/${sPortletId}`).destroy();
        }

        oPortletsModel.refresh();

        setTimeout(() => {
          oPortletsModel.setProperty('/busy', false);
        }, 500);
      },

      /**
       * Portlets.controller.js 에서 호출
       */
      openPortletsP13nDialog() {
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
          const oController = this.getController();
          const oPortletsModel = this.getPortletsModel();
          const mActivePortlets = {};
          const aPortletItems = oController.getPortletItems();

          if (aPortletItems.length === 1 && aPortletItems[0].hasStyleClass('portlets-not-found')) {
            return true;
          }

          aPortletItems.forEach((oPortlet) => {
            this.mapPortletPosition(oPortlet, mActivePortlets, sClosingPortletId);
          });

          const aPortletData = oPortletsModel.getProperty('/allList').map((mPortletData) => {
            const mData = mActivePortlets[mPortletData.id];
            if (mData) {
              return mData;
            }
            if (mPortletData.id === sClosingPortletId) {
              mPortletData.active = false;
            }
            return this.getPortletPosition(mPortletData, -1);
          });

          const oModel = oController.getModel(ServiceNames.COMMON);
          const mPayload = {
            Mode: 'U',
            PortletInfoTab2Set: aPortletData,
          };

          await Client.create(oModel, 'PortletInfo', mPayload);

          return true;
        } catch (oError) {
          AppUtils.handleError(oError);

          return false;
        }
      },

      /**
       * 활성화된 portlet 위치 정보 저장
       * @param {object} oPortlet 위치 정보를 추출할 portlet object
       * @param {map} mActivePortlets 위치 정보가 저장될 map
       * @param {string} sClosingPortletId Portlet 닫기 버튼 클릭 또는 스위치 off로 비활성화될 portlet의 id
       */
      mapPortletPosition(oPortlet, mActivePortlets, sClosingPortletId) {
        const oPortletModel = oPortlet.getModel();

        if (oPortletModel.getProperty('/multiPortlet')) {
          if (oPortletModel.getProperty('/orgMembersActive')) {
            const mPortletData = oPortletModel.getProperty('/orgMembers');
            if (mPortletData.id === sClosingPortletId) {
              return;
            }

            const iPortletCount = this.getPortletCount(mActivePortlets);

            mActivePortlets[mPortletData.id] = this.getPortletPosition(mPortletData, iPortletCount);
          }
          if (oPortletModel.getProperty('/myMembersActive')) {
            const mPortletData = oPortletModel.getProperty('/myMembers');
            if (mPortletData.id === sClosingPortletId) {
              return;
            }

            const iPortletCount = this.getPortletCount(mActivePortlets);

            mActivePortlets[mPortletData.id] = this.getPortletPosition(mPortletData, iPortletCount);
          }
        } else {
          const mPortletData = oPortletModel.getData();
          if (mPortletData.id === sClosingPortletId) {
            return;
          }

          const iPortletCount = this.getPortletCount(mActivePortlets);

          mActivePortlets[mPortletData.id] = this.getPortletPosition(mPortletData, iPortletCount);
        }
      },

      getPortletCount(mData) {
        return Object.keys(mData).length;
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

      getController() {
        return this.oController;
      },

      getPortletsModel() {
        return this.oPortletsModel;
      },

      destroy() {
        this.getController().getView().removeDependent(this.oPortletsP13nDialog);
        this.oPortletsP13nDialog.destroy();
      },
    });
  }
);
