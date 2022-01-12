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
     * 내동료 현황 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P04PortletHandler', {
      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        oPortletModel.setData(
          {
            myMembers: oPortletModel.getData(),
          },
          true
        );
        delete oPortletModel.getProperty('/').original;

        const oP03PortletHandler = this.getController().getViewModel().getProperty('/activeInstanceMap/P03');
        if (oP03PortletHandler) {
          this.setFragment(oP03PortletHandler.getFragment());

          const oP04PortletModel = oP03PortletHandler.getPortletModel();
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

        return Client.getEntitySet(oModel, 'PortletPartners');
      },

      transformContentData(aMyMembers) {
        return {
          multiPortlet: true,
          selectedMembersTab: 'MY',
          myMembers: {
            active: true,
            ...this.transformMembersData(aMyMembers),
          },
        };
      },

      transformMembersData(aMembers = []) {
        aMembers.forEach((mData, i) => {
          delete mData.__metadata;
          if (i % 3 === 0) {
            mData.Icon = 'red';
            mData.Atext = '외근';
          }
          if (i % 3 === 1) {
            mData.Icon = 'blue';
            mData.Atext = '근무중';
          }
          if (i % 3 === 2) {
            mData.Icon = 'grey';
            mData.Atext = '휴가중';
          }
        });

        return {
          list: aMembers,
          listCount: aMembers.length,
        };
      },

      async onPressMyMemberAdd() {
        const oController = this.getController();

        await oController.EmployeeSearch.onSearchDialog.call(oController, (mSelectedEmp = {}, bClickedCloseButton) => {
          if (bClickedCloseButton) {
            return;
          }
          this.addMyMember(mSelectedEmp.Pernr);
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

            this.removeMyMember(sPernr);
          },
        });
      },

      async addMyMember(sPernr) {
        try {
          AppUtils.setAppBusy(true);

          if (!(sPernr || '').replace(/^0+/, '')) {
            throw new UI5Error({ message: AppUtils.getBundleText('MSG_00035') }); // 대상자 사번이 없습니다.
          }

          const oModel = this.getController().getModel(ServiceNames.COMMON);

          await Client.create(oModel, 'PortletPartners', {
            Pernr: sPernr,
          });

          this.refreshMyMembers();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false);
        }
      },

      async removeMyMember(sPernr) {
        try {
          AppUtils.setAppBusy(true);

          const oModel = this.getController().getModel(ServiceNames.COMMON);

          await Client.remove(oModel, 'PortletPartners', {
            Pernr: sPernr,
          });

          this.refreshMyMembers();
          // const sMessage = AppUtils.getBundleText('MSG_00007', 'LABEL_00110'); // {삭제}되었습니다.
          // MessageBox.alert(sMessage, {
          //   onClose: () => {
          //   },
          // });
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          AppUtils.setAppBusy(false);
        }
      },

      async refreshMyMembers() {
        const aMyMembers = await this.readContentData();
        const mMyMembers = this.transformMembersData(aMyMembers);
        const oPortletModel = this.getPortletModel();

        oPortletModel.setProperty('/myMembers/list', mMyMembers.list);
        oPortletModel.setProperty('/myMembers/listCount', mMyMembers.listCount);
      },

      destroy() {
        const oPortletModel = this.getPortletModel();
        const bActiveOrgMembers = oPortletModel.getProperty('/orgMembers/active');
        if (bActiveOrgMembers) {
          oPortletModel.setProperty('/selectedMembersTab', 'ORG');
          oPortletModel.setProperty('/myMembers/active', false);

          const sPortletId = oPortletModel.getProperty('/id');
          const oPortletsModel = this.getController().getViewModel();
          oPortletsModel.setProperty(`/allMap/${sPortletId}/active`, false);
          oPortletsModel.setProperty(`/allMap/${sPortletId}/position/column`, 1);
          oPortletsModel.setProperty(`/allMap/${sPortletId}/position/sequence`, 0);
          _.remove(oPortletsModel.getProperty('/activeList'), (mPortletData) => {
            return mPortletData.id === sPortletId;
          });
          delete oPortletsModel.getProperty('/activeMap')[sPortletId];
          delete oPortletsModel.getProperty('/activeInstanceMap')[sPortletId];
          oPortletsModel.refresh();

          delete oPortletModel.getProperty('/').myMembers;
          oPortletModel.refresh();
        } else {
          oPortletModel.destroy();
          this.getFragment().destroy();
        }
      },
    });
  }
);
