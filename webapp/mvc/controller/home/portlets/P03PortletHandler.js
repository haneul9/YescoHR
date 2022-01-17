sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    MessageBox,
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

      onPressLink() {
        const oPortletModel = this.getPortletModel();
        const sSelectedMembersTab = oPortletModel.getProperty('/selectedMembersTab');
        if (sSelectedMembersTab === 'MY') {
          this.getController().getViewModel().getProperty('/activeInstanceMap/P04').onPressLink();
          return;
        }

        const bHasLink = oPortletModel.getProperty('/orgMembers/hasLink');
        const sUrl = oPortletModel.getProperty('/orgMembers/url');
        if (!bHasLink || !sUrl) {
          const sTitle = oPortletModel.getProperty('/orgMembers/title');
          MessageBox.alert(AppUtils.getBundleText('MSG_01903', sTitle)); // {sTitle} portlet의 더보기 링크가 없거나 설정이 올바르지 않습니다.
          return;
        }

        this.navTo(sUrl);
      },

      onPressClose() {
        const oPortletModel = this.getPortletModel();
        const sSelectedMembersTab = oPortletModel.getProperty('/selectedMembersTab');
        if (sSelectedMembersTab === 'MY') {
          this.getController().getViewModel().getProperty('/activeInstanceMap/P04').onPressClose();
          return;
        }

        const sTitle = oPortletModel.getProperty('/orgMembers/title');
        const sMessage = AppUtils.getBundleText('MSG_01902', sTitle); // {sTitle} portlet을 홈화면에 더이상 표시하지 않습니다.\n다시 표시하려면 홈화면 우측 상단 톱니바퀴 아이콘을 클릭하여 설정할 수 있습니다.

        MessageBox.confirm(sMessage, {
          onClose: async (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              return;
            }

            const sPortletId = oPortletModel.getProperty('/orgMembers/id');
            const bSuccess = await this.getController().onPressPortletsP13nSave(sPortletId);
            if (bSuccess) {
              this.destroy();
            }
          },
        });
      },

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
