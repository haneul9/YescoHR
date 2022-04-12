sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    FragmentEvent,
    TextUtils,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.withdrawMiddle.WithdrawMiddleDetail', {
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          FormData: {},
          busy: false,
        };
      },

      async onObjectMatched(oParameter) {
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());
        oDetailModel.setProperty('/busy', true);

        try {
          const sDataKey = oParameter.oDataKey;

          if (!sDataKey || sDataKey === 'N') {
            oDetailModel.setProperty('/FormData', { Wtamt: '0' });
          } else {
            // 상세조회
            const oModel = this.getModel(ServiceNames.PAY);
            const aDetail = await Client.getEntitySet(oModel, 'MidWithdraw', { Appno: sDataKey });

            oDetailModel.setProperty('/FormData', aDetail[0]);
          }
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      costCalculation(oEvent) {
        this.TextUtils.liveChangeCurrency(oEvent);
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const mFormData = oDetailModel.getProperty('/FormData');

        // 인출일
        if (!mFormData.Wtdat) {
          MessageBox.alert(this.getBundleText('MSG_24001')); //인출일을 선택하세요.
          return true;
        }

        // 인출금액
        if (!mFormData.Wtamt || mFormData.Wtamt === '0') {
          MessageBox.alert(this.getBundleText('MSG_24002')); //인출금액을 입력하세요.
          return true;
        }

        return false;
      },

      // 신청
      onApplyBtn() {
        if (this.checkError()) return;

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')], // 신청, 취소
          onClose: async (vPress) => {
            // 신청
            if (vPress !== this.getBundleText('LABEL_00121')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true);

              const oModel = this.getModel(ServiceNames.PAY);
              const oDetailModel = this.getViewModel();
              const mFormData = oDetailModel.getProperty('/FormData');

              mFormData.Menid = this.getCurrentMenuId();
              mFormData.Waers = 'KRW';
              mFormData.Pernr = this.getAppointeeProperty('Pernr');

              await Client.create(oModel, 'MidWithdraw', mFormData);

              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                onClose: () => {
                  this.onNavBack();
                },
              }); // {신청}되었습니다.
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        // {삭제}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')], // 삭제, 취소
          onClose: async (vPress) => {
            // 삭제
            if (vPress !== this.getBundleText('LABEL_00110')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true);

              const oModel = this.getModel(ServiceNames.PAY);
              const oDetailModel = this.getViewModel();

              await Client.remove(oModel, 'MidWithdraw', { Appno: oDetailModel.getProperty('/FormData/Appno') });

              // {삭제}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },
    });
  }
);
