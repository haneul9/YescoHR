sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/mvc/controller/home/portlets/P03P04PortletCommonHandler',
  ],
  (
    // prettier 방지용 주석
    P03P04PortletCommonHandler
  ) => {
    'use strict';

    /**
     * 부서원 목록 Portlet
     */
    return P03P04PortletCommonHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P03PortletHandler', {
      setInherency() {
        this.SELECTED_BUTTON = 'ORG';
        this.ROOT_PATH = 'orgMembers';
        this.ACTIVE_PATH = 'orgMembersActive';
        this.ODATA_ENTITY_TYPE = 'PortletOrgInfo';
      },
    });
  }
);
