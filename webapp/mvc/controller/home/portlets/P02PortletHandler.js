sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/home/portlets/AbstractPortletHandler',
    'sap/ui/yesco/mvc/model/type/Date', // XML expression binding용 type preloading
  ],
  (
    // prettier 방지용 주석
    AppUtils,
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
        const sUrl = 'PortletNotice';

        return Client.getEntitySet(oModel, sUrl);
      },

      transformContentData(aPortletContentData = []) {
        // const mTemp = aPortletContentData[0];
        // aPortletContentData.splice(0, 0, { ...mTemp }, { ...mTemp }, { ...mTemp }, { ...mTemp }, { ...mTemp }, { ...mTemp }, { ...mTemp }, { ...mTemp }, { ...mTemp }, { ...mTemp }, { ...mTemp }, { ...mTemp }, { ...mTemp }, { ...mTemp });

        // aPortletContentData.forEach((mData, i) => {
        //   mData.Title += mData.Title;
        //   mData.Newitem = '';
        //   mData.Impor = '';
        //   if (i % 3 === 1) {
        //     mData.Newitem = 'X';
        //   }
        //   if (i % 3 === 2) {
        //     mData.Impor = 'X';
        //   }
        // });

        let newCount = 0;
        let importantCount = 0;

        aPortletContentData.forEach((mData) => {
          delete mData.__metadata;

          if (mData.Newitem === 'X') {
            newCount += 1;
          }
          if (mData.Impor === 'X') {
            importantCount += 1;
          }
        });

        return {
          list: aPortletContentData,
          listCount: aPortletContentData.length,
          newCount,
          importantCount,
        };
      },

      onPressNoticeArticle(oEvent) {
        const oContext = oEvent.getSource().getBindingContext();
        const sSeqnr = oContext.getProperty('Seqnr');
        const iSdate = oContext.getProperty('Sdate').getTime();

        this.navTo('notice-detail', { oDataKey: 0, Sdate: iSdate, Seqnr: sSeqnr });
      },
    });
  }
);
