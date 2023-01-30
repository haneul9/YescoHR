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
     * 나의 휴가 현황 Portlet
     */
    return AbstractPortletHandler.extend('sap.ui.yesco.mvc.controller.home.portlets.P12PortletHandler', {
      async addPortlet() {
        const oPortletModel = this.getPortletModel();
        const sPortletId = oPortletModel.getProperty('/id');
        const sFragmentName = this.bMobile ? `sap.ui.yesco.mvc.view.home.mobile.${sPortletId}PortletBox` : 'sap.ui.yesco.mvc.view.home.fragment.P12PortletBox';
        const oPortletBox = await Fragment.load({
          id: this.getController().getView().getId(),
          name: sFragmentName,
          controller: this,
        });

        // TODO : 예전 포틀릿 스타일 다시 살리기 P11, P12
        oPortletBox.setModel(oPortletModel).bindElement('/').addStyleClass(this.getPortletStyleClasses());

        this.getController().byId(this.sContainerId).addItem(oPortletBox);
        this.setPortletBox(oPortletBox);
      },

      async readContentData() {
        const oController = this.getController();
        const oModel = oController.getModel(ServiceNames.WORKTIME);
        const mPayload = {
          Menid: this.getPortletCommonMenid(),
        };

        return Client.getEntitySet(oModel, 'AbsQuotaList', mPayload);
      },

      transformContentData(aPortletContentData = []) {
        const mPortletContentData = {};
        aPortletContentData.forEach((mData) => {
          if (mData.Ktart === '10') {
            const { Total = 0, Used = 0, Remain = 0 } = mPortletContentData.Annual || {};
            mPortletContentData.Annual = { Total: Total + parseFloat(mData.Crecnt), Used: Used + parseFloat(mData.Usecnt), Remain: Remain + parseFloat(mData.Balcnt) };
          }
          if (mData.Ktart === '15') {
            const { Total = 0, Used = 0, Remain = 0 } = mPortletContentData.Annual || {};
            mPortletContentData.Annual = { Total: Total + parseFloat(mData.Crecnt), Used: Used + parseFloat(mData.Usecnt), Remain: Remain + parseFloat(mData.Balcnt) };
          }
          if (mData.Ktart === '20') {
            mPortletContentData.Summer = { Total: parseFloat(mData.Crecnt), Used: parseFloat(mData.Usecnt), Remain: parseFloat(mData.Balcnt) };
          }
        });
        if (!mPortletContentData.Annual) {
          mPortletContentData.Annual = { Total: 0, Used: 0, Remain: 0 };
        }
        if (!mPortletContentData.Summer) {
          mPortletContentData.Summer = { Total: 0, Used: 0, Remain: 0 };
        }

        if (this.bMobile) {
          mPortletContentData.hideTitle = true;
          mPortletContentData.switchable = false;

          mPortletContentData.ButtonText1 = this.getMenuName('attendance');
          const Werks = this.getController().getSessionProperty('Werks');
          if ('1000,4000,5000'.split(',').includes(Werks)) {
            mPortletContentData.ButtonText2 = this.getMenuName('flextime'); // 선택적근로제
          } else if ('3000'.split(',').includes(Werks)) {
            mPortletContentData.ButtonText2 = this.getMenuName('individualWorkState'); // 개인별근태현황
          } else {
            mPortletContentData.ButtonText2 = this.getMenuName('workTime'); // 시간외근무신청
          }
        }

        return mPortletContentData;
      },

      getMenuName(sMenuUrl) {
        const oMenuModel = this.getMenuModel();
        const sMenid = oMenuModel.getMenid(this.bMobile ? `mobile/${sMenuUrl}` : sMenuUrl);

        return oMenuModel.getProperties(sMenid).Mname;
      },

      /**
       * Mobile
       */
      onPressButton1() {
        this.navTo('attendance');
      },

      /**
       * Mobile
       */
      onPressButton2() {
        const Werks = this.getController().getSessionProperty('Werks');
        let sRouteName;
        if ('1000,4000,5000'.split(',').includes(Werks)) {
          sRouteName = 'flextime'; // 선택적근로제
        } else if ('3000'.split(',').includes(Werks)) {
          sRouteName = 'individualWorkState'; // 개인별근태현황
        } else {
          sRouteName = 'workTime'; // 시간외근무신청
        }

        this.navTo(sRouteName);
      },
    });
  }
);
