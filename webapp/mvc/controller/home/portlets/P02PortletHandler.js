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
      getPortletBodyContentFragmentName(sPortletKey) {
        return this.bMobile ? `sap.ui.yesco.mvc.view.home.mobile.${sPortletKey}PortletBodyContent` : `sap.ui.yesco.mvc.view.home.fragment.${sPortletKey}PortletBodyContent`;
      },

      getPortletStyleClasses() {
        const sStyleClasses = AbstractPortletHandler.prototype.getPortletStyleClasses.call(this);
        return this.bMobile ? `${sStyleClasses} portlet-content-scrollable` : sStyleClasses;
      },

      async readContentData() {
        const oModel = this.getController().getModel(ServiceNames.COMMON);

        return Client.getEntitySet(oModel, 'PortletNotice');
      },

      transformContentData(aPortletContentData = []) {
        // aPortletContentData = [];
        // aPortletContentData = aPortletContentData.slice(0, 1);
        // aPortletContentData = aPortletContentData.concat(aPortletContentData);
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

        const iListCount = aPortletContentData.length;
        this.getPortletBox()
          .toggleStyleClass('no-data', !iListCount)
          .toggleStyleClass('no-scroll', iListCount && iListCount <= 7) // TODO : Portlet 높이에 행 높이를 나눠서 비교 숫자를 넣어야함
          .togglePortletBodyStyleClass('no-new', !iNewCount)
          .togglePortletBodyStyleClass('no-important', !iImportantCount);

        return {
          list: aPortletContentData,
          listCount: iListCount,
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
