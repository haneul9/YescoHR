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
     * 부서원 현황 / 내동료 현황 Portlet 공통
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P03P04PortletCommonHandler', {
      SEGMENTED_BUTTON_KEY: null,
      SIBLING_BUTTON_KEY: null,
      ROOT_PATH: null,
      ACTIVE_PATH: null,
      ODATA_ENTITY_TYPE: null,

      async addPortlet() {
        this.setInherency();

        const oPortletModel = this.getPortletModel();
        const oPortletData = oPortletModel.getData();
        const oSiblingPortletHandler = this.getController().getViewModel().getProperty(`/activeInstanceMap/${this.SIBLING_BUTTON_KEY}`);

        if (oSiblingPortletHandler) {
          const oSiblingPortletModel = oSiblingPortletHandler.getPortletModel();
          const iWidth = Math.max(oPortletData.width, oSiblingPortletModel.getProperty('/width'));
          const iHeight = Math.max(oPortletData.height, oSiblingPortletModel.getProperty('/height'));

          oSiblingPortletModel.setProperty(`/${this.ROOT_PATH}`, oPortletData);
          oSiblingPortletModel.setProperty('/width', iWidth);
          oSiblingPortletModel.setProperty('/height', iHeight);

          oPortletModel.destroy();

          this.setPortletModel(oSiblingPortletModel);

          const oSiblingPortletFragment = oSiblingPortletHandler.getFragment();
          if (oSiblingPortletFragment) {
            oSiblingPortletFragment
              .$()
              .parent()
              .css({ 'grid-column': `span ${iWidth}`, 'grid-row': `span ${iHeight}` });

            this.setFragment(oSiblingPortletFragment);
          }
        } else {
          oPortletModel.setData(this.filterProperties(oPortletData));
          oPortletModel.setProperty(`/${this.ROOT_PATH}`, oPortletData);

          const oFragment = await Fragment.load({
            name: 'sap.ui.yesco.mvc.view.home.fragment.PortletsP03P04',
            controller: this,
          });

          oFragment.setModel(oPortletModel).bindElement('/');

          this.oController.byId(this.sContainerId).addItem(oFragment);
          this.setFragment(oFragment);
        }
      },

      filterProperties(oPortletData) {
        const { busy, switchable, width, height, hideTitle, multiPortlet, selectedMembersButton, orgMembersActive = false, myMembersActive = false } = oPortletData;
        return { busy, switchable, width, height, hideTitle, multiPortlet, selectedMembersButton, orgMembersActive, myMembersActive };
      },

      async getNewPortletFragment() {
        const oFragment = await Fragment.load({
          name: 'sap.ui.yesco.mvc.view.home.fragment.PortletsP03P04',
          controller: this,
        });
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);

        return Client.getEntitySet(oModel, this.ODATA_ENTITY_TYPE);
      },

      transformContentData(aMembers) {
        return {
          multiPortlet: true,
          selectedMembersButton: this.SEGMENTED_BUTTON_KEY,
          [this.ACTIVE_PATH]: true,
          [this.ROOT_PATH]: this.transformMembersData(aMembers),
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

      getSelectedPortletHandler() {
        const oPortletModel = this.getPortletModel();
        const sSelectedMembersButton = oPortletModel.getProperty('/selectedMembersButton');
        const oPortletHandler = this.getController().getViewModel().getProperty(`/activeInstanceMap/${sSelectedMembersButton}`);

        return {
          oPortletModel,
          oPortletHandler,
        };
      },

      async onPressMyMemberAdd() {
        const oController = this.getController();

        await oController.EmployeeSearch.onSearchDialog.call(oController, (mSelectedEmp = {}, bClickedCloseButton) => {
          if (bClickedCloseButton) {
            return;
          }

          this.getSelectedPortletHandler().oPortletHandler.addMyMember(mSelectedEmp.Pernr);
        });

        const oViewModel = oController.getViewModel();
        oViewModel.setProperty('/employeeModel/Enabled/Stat2', false);
        oViewModel.setProperty('/employeeModel/Search/Stat2', '3');
      },

      onPressMyMemberRemove(oEvent) {
        const sPernr = oEvent.getSource().getBindingContext().getProperty('Pernr');
        const sMessage = AppUtils.getBundleText('MSG_01101'); // 내동료 목록에서 삭제하시겠습니까?

        MessageBox.confirm(sMessage, {
          onClose: (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              return;
            }

            this.getSelectedPortletHandler().oPortletHandler.removeMyMember(sPernr);
          },
        });
      },

      onPressLink() {
        const { oPortletModel, oPortletHandler } = this.getSelectedPortletHandler();

        const bHasLink = oPortletModel.getProperty(`/${oPortletHandler.ROOT_PATH}/hasLink`);
        const sUrl = oPortletModel.getProperty(`/${oPortletHandler.ROOT_PATH}/url`);
        if (!bHasLink || !sUrl) {
          const sTitle = oPortletModel.getProperty(`/${oPortletHandler.ROOT_PATH}/title`);
          MessageBox.alert(AppUtils.getBundleText('MSG_01903', sTitle)); // {sTitle} portlet의 더보기 링크가 없거나 설정이 올바르지 않습니다.
          return;
        }

        this.navTo(sUrl);
      },

      onPressClose() {
        const { oPortletModel, oPortletHandler } = this.getSelectedPortletHandler();
        const sTitle = oPortletModel.getProperty(`/${oPortletHandler.ROOT_PATH}/title`);
        const sMessage = AppUtils.getBundleText('MSG_01902', sTitle); // {sTitle} portlet을 홈화면에 더이상 표시하지 않습니다.\n다시 표시하려면 홈화면 우측 상단 톱니바퀴 아이콘을 클릭하여 설정할 수 있습니다.

        MessageBox.confirm(sMessage, {
          onClose: async (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              return;
            }

            const sPortletId = oPortletModel.getProperty(`/${oPortletHandler.ROOT_PATH}/id`);
            const bSuccess = await this.getController().onPressPortletsP13nSave(sPortletId);
            if (bSuccess) {
              oPortletHandler.destroy();
            }
          },
        });
      },

      destroy() {
        const oPortletModel = this.getPortletModel();
        const bOrgMembersActive = oPortletModel.getProperty('/orgMembersActive');
        const bMyMembersActive = oPortletModel.getProperty('/myMembersActive');
        const sPortletId = oPortletModel.getProperty(`/${this.ROOT_PATH}/id`);

        if (bOrgMembersActive && bMyMembersActive) {
          oPortletModel.setProperty('/selectedMembersButton', this.SIBLING_BUTTON_KEY);
          oPortletModel.setProperty(`/${this.ACTIVE_PATH}`, false);
          oPortletModel.setProperty(`/${this.ROOT_PATH}/active`, false);

          delete oPortletModel.getProperty('/')[this.ROOT_PATH];
          oPortletModel.refresh();
        } else {
          oPortletModel.destroy();
          this.getFragment().destroy();
        }

        this.resetPortletData(sPortletId);
      },
    });
  }
);
