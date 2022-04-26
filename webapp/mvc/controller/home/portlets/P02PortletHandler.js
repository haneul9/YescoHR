sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
  ],
  (
    // prettier 방지용 주석
    Client,
    ServiceNames,
    AbstractPortletHandler
  ) => {
    'use strict';

    /**
     * 공지사항 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P02PortletHandler', {
      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);

        return Client.getEntitySet(oModel, 'PortletNotice');
      },

      transformContentData(aPortletContentData = []) {
        let iNewCount = 0;
        let iImportantCount = 0;

        aPortletContentData.forEach((mData) => {
          delete mData.__metadata;

          if (mData.Newitem === 'X') {
            iNewCount += 1;
          }
          if (mData.Impor === 'X') {
            iImportantCount += 1;
          }
        });

        return {
          list: aPortletContentData,
          listCount: aPortletContentData.length,
          newCount: iNewCount,
          importantCount: iImportantCount,
        };
      },

      onPressNoticeArticle(oEvent) {
        const oContext = oEvent.getSource().getBindingContext();
        const sSeqnr = oContext.getProperty('Seqnr');
        const iSdate = oContext.getProperty('Sdate').getTime();

        this.navTo('notice-detail', { Sdate: iSdate, Seqnr: sSeqnr });
      },
    });
  }
);
