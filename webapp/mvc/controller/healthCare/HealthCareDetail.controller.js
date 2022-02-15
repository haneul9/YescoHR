/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
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
    JSONModel,
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.healthCare.HealthCareDetail', {
      LIST_PAGE_ID: 'container-ehr---healthCare',

      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          minDate: moment(`${moment().year()}-01-01`).toDate(),
          maxDate: moment(`${moment().year()}-12-31`).toDate(),
          FormData: {},
          HealthType: [],
          busy: false,
          Fixed: false,
        };
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());
        oDetailModel.setProperty('/busy', true);

        try {
          const sWerks = this.getSessionProperty('Werks');
          let sMsg = '';

          if (sWerks === '3000') {
            // 한성
            sMsg = this.getBundleText('MSG_21003'); // ※ 건강검진 예약 내역을 확인 후 수정/관리하시기 바랍니다.
          } else {
            // 그외
            sMsg = this.getBundleText('MSG_21002'); // ※ 건강검진 내역을 수정하고자 하는 경우 담당자에게 연락하시기 바랍니다.
          }

          oDetailModel.setProperty('/InfoMessage', sMsg);

          // 검진 구분
          const oModel = this.getModel(ServiceNames.BENEFIT);
          const aCareType = await Client.getEntitySet(oModel, 'HealthCareItype');

          oDetailModel.setProperty('/CareItype', aCareType);

          const oView = this.getView();
          const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);

          if (!oListView) {
            // 잘못된 접근입니다.
            return MessageBox.alert(this.getBundleText('MSG_00043'), {
              onClose: () => {
                this.getRouter().navTo('healthCare');
              },
            });
          }

          const mListData = oListView.getModel().getProperty('/parameters');
          const mPayLoad = {
            Begda: mListData.Begda,
            Endda: mListData.Endda,
            Seqnr: sDataKey,
          };
          const [aCareDetail] = await Client.getEntitySet(oModel, 'HealthCareContents', mPayLoad);
          aCareDetail.Pyear = moment(aCareDetail.Pyear)._d;

          oDetailModel.setProperty('/FormData', aCareDetail);
          oDetailModel.setProperty('/minDate', moment(`${aCareDetail.Gjahr}-01-01`).toDate());
          oDetailModel.setProperty('/maxDate', moment(`${aCareDetail.Gjahr}-12-31`).toDate());
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      getCurrentLocationText() {
        return this.getBundleText('LABEL_00165'); // 상세
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const mFormData = oDetailModel.getProperty('/FormData');

        // 검진일
        if (!mFormData.Begda) {
          MessageBox.alert(this.getBundleText('MSG_21004')); //검진일을 선택하세요.
          return true;
        }

        // 대상자 출생연도
        if (!mFormData.Pyear) {
          MessageBox.alert(this.getBundleText('MSG_21005')); //대상자 출생연도를 선택하세요.
          return true;
        }

        mFormData.Pyear = moment(mFormData.Pyear).format('YYYY');

        // 검진 구분
        if (mFormData.Itype === 'ALL' || !mFormData.Itype) {
          MessageBox.alert(this.getBundleText('MSG_21006')); //검진 구분을 선택하세요.
          return true;
        }

        // 검진기관명
        if (!mFormData.Ihopt) {
          MessageBox.alert(this.getBundleText('MSG_21007')); //검진기관명을 입력하세요.
          return true;
        }

        // 주요검진항목
        if (!mFormData.Instx) {
          MessageBox.alert(this.getBundleText('MSG_21008')); //주요검진항목을 입력하세요.
          return true;
        }

        return false;
      },

      // 수정
      onFixBtn() {
        this.getViewModel().setProperty('/Fixed', true);
      },

      // 저장
      onSaveBtn() {
        if (this.checkError()) return;

        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')], // 저장, 취소
          onClose: async (vPress) => {
            // 저장
            if (vPress !== this.getBundleText('LABEL_00103')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true, this);

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const oDetailModel = this.getViewModel();
              const mFormData = oDetailModel.getProperty('/FormData');

              await Client.create(oModel, 'HealthCareContents', mFormData);

              // {저장}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'), {
                onClose: () => {
                  this.onNavBack();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },
    });
  }
);
