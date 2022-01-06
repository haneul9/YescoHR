sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/model/type/Date', // XML expression binding용 type preloading
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    MessageBox,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * 부서원 및 동료 현황 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P03PortletHandler', {
      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);
        const [aOrgMembers, aMyMembers] = await Promise.all([
          Client.getEntitySet(oModel, 'PortletOrgInfo'), //
          Client.getEntitySet(oModel, 'PortletPartners'),
        ]);

        return [aOrgMembers, aMyMembers];
      },

      transformContentData([aOrgMembers = [], aMyMembers = []]) {
        return {
          selectedMembersTab: 'ORG',
          orgMembers: this.transformMembersData(aOrgMembers),
          myMembers: this.transformMembersData(aMyMembers),
        };
      },

      transformMembersData(aMembers = []) {
        aMembers.forEach((mData, i) => {
          delete mData.__metadata;
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

      async onPressMyMemberAdd() {
        const oController = this.getController();

        await oController.EmployeeSearch.onSearchDialog.call(oController, (mSelectedEmp = {}) => {
          this.addMyMember(mSelectedEmp.Pernr);
        });

        const oViewModel = oController.getViewModel();
        oViewModel.setProperty('/employeeModel/Enabled/Stat2', false);
        oViewModel.setProperty('/employeeModel/Search/Stat2', '3');
      },

      onPressMyMemberRemove(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBindingContext().getPath();
        const sPernr = oEventSource.getModel().getProperty(`${sPath}/Pernr`);
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
        const oModel = this.getController().getModel(ServiceNames.COMMON);
        const aMyMembers = await Client.getEntitySet(oModel, 'PortletPartners');

        this.getPortletModel().setProperty('/myMembers', this.transformMembersData(aMyMembers));
      },
    });
  }
);
