sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/P03P04PortletCommonHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    UI5Error,
    Client,
    ServiceNames,
    P03P04PortletCommonHandler
  ) => {
    'use strict';

    /**
     * 내동료 목록 Portlet
     */
    return P03P04PortletCommonHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P04PortletHandler', {
      setInherency() {
        this.SELECTED_BUTTON = 'MY';
        this.ROOT_PATH = 'myMembers';
        this.ACTIVE_PATH = 'myMembersActive';
        this.ODATA_ENTITY_TYPE = 'PortletPartners';
      },

      async addMyMember(sPernr) {
        try {
          AppUtils.setAppBusy(true);

          if (!(sPernr || '').replace(/^0+/, '')) {
            throw new UI5Error({ message: AppUtils.getBundleText('MSG_00035') }); // 대상자 사번이 없습니다.
          }

          const oModel = this.getController().getModel(ServiceNames.COMMON);

          await Client.create(oModel, this.ODATA_ENTITY_TYPE, {
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

          await Client.remove(oModel, this.ODATA_ENTITY_TYPE, {
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

        oPortletModel.setProperty(`/${this.ROOT_PATH}/list`, mMyMembers.list);
        oPortletModel.setProperty(`/${this.ROOT_PATH}/listCount`, mMyMembers.listCount);
      },
    });
  }
);
