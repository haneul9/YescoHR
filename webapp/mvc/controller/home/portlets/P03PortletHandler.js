sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Client,
    ServiceNames,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * 부서원 현황 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P03PortletHandler', {
      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        oPortletModel.setData(
          {
            orgMembers: oPortletModel.getData(),
          },
          true
        );
        delete oPortletModel.getProperty('/').original;

        const oP04PortletHandler = this.getController().getViewModel().getProperty('/activeInstanceMap/P04');
        if (oP04PortletHandler) {
          this.setFragment(oP04PortletHandler.getFragment());

          const oP04PortletModel = oP04PortletHandler.getPortletModel();
          oP04PortletModel.setData(oPortletModel.getData(), true);
          this.setPortletModel(oP04PortletModel);

          return;
        }

        const oFragment = await Fragment.load({
          name: 'sap.ui.yesco.mvc.view.home.fragment.PortletsP03P04',
          controller: this,
        });

        const iPortletHeight = oPortletModel.getProperty('/height');
        oFragment.setModel(oPortletModel).bindElement('/').addStyleClass(`portlet-height-${iPortletHeight}`);

        this.oController.byId(this.sContainerId).addItem(oFragment);
        this.setFragment(oFragment);
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);

        return Client.getEntitySet(oModel, 'PortletOrgInfo');
      },

      transformContentData(aOrgMembers) {
        return {
          multiPortlet: true,
          selectedMembersTab: 'ORG',
          orgMembers: {
            active: true,
            ...this.transformMembersData(aOrgMembers),
          },
        };
      },

      transformMembersData(aMembers = []) {
        aMembers.forEach((mData, i) => {
          delete mData.__metadata;

          mData.Photo ||= 'asset/image/avatar-unknown.svg';
          // if (i % 3 === 0) {
          //   mData.Icon = 'red';
          //   mData.Atext = '외근';
          // }
          // if (i % 3 === 1) {
          //   mData.Icon = 'blue';
          //   mData.Atext = '근무중';
          // }
          // if (i % 3 === 2) {
          //   mData.Icon = 'grey';
          //   mData.Atext = '휴가중';
          // }
        });

        return {
          list: aMembers,
          listCount: aMembers.length,
        };
      },

      onPressMyMemberAdd() {
        this.getController().getViewModel().getProperty('/activeInstanceMap/P04').onPressMyMemberAdd();
      },

      onPressMyMemberRemove(oEvent) {
        this.getController().getViewModel().getProperty('/activeInstanceMap/P04').onPressMyMemberRemove(oEvent);
      },

      onPressClose() {},

      destroy() {
        const oPortletModel = this.getPortletModel();
        const bActiveMyMembers = oPortletModel.getProperty('/myMembers/active');
        if (bActiveMyMembers) {
          oPortletModel.setProperty('/selectedMembersTab', 'MY');
          oPortletModel.setProperty('/orgMembers/active', false);

          this.resetPortletData(oPortletModel.getProperty('/orgMembers/id'));

          delete oPortletModel.getProperty('/').orgMembers;
          oPortletModel.refresh();
        } else {
          oPortletModel.destroy();
          this.getFragment().destroy();
        }
      },
    });
  }
);
