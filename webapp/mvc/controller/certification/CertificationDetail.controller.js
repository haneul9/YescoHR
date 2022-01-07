/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
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
    Appno,
    AppUtils,
    ComboEntry,
    FragmentEvent,
    TextUtils,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.certification.certificationDetail', {
      LIST_PAGE_ID: 'container-ehr---certification',
      LIST_PAGE: 'certification',

      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      onBeforeShow() {
        const oViewModel = new JSONModel({
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          ViewKey: '',
          FormData: {},
          CertiType: [],
          CertiGubun: [],
          AppPiece: [],
          IssuanceArea: [],
          IssuanceList: [],
          Receive: [],
          Years: [],
          busy: false,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();

        oDetailModel.setProperty('/ViewKey', sDataKey);

        try {
          const oModel = this.getModel(ServiceNames.PA);
          // 증명서유형
          const aList1 = await Client.getEntitySet(oModel, 'CertificateObjList');

          oDetailModel.setProperty('/CertiType', new ComboEntry({ codeKey: 'Certy', valueKey: 'Certx', aEntries: aList1 }));

          // 구분
          const aList2 = await Client.getEntitySet(oModel, 'CertificateReqList');

          oDetailModel.setProperty('/CertiGubun', new ComboEntry({ codeKey: 'Reqty', valueKey: 'Reqtx', aEntries: aList2 }));

          // 신청부수
          const aList3 = await this.getAppPiece();

          oDetailModel.setProperty('/AppPiece', aList3);

          // 발급처
          const aList4 = await Client.getEntitySet(oModel, 'CertificateBtrtlList', { Werks: this.getAppointeeProperty('Werks') });

          oDetailModel.setProperty('/IssuanceArea', new ComboEntry({ codeKey: 'Btrtl', valueKey: 'Btext', aEntries: aList4 }));

          // 발급용도
          const aList5 = await Client.getEntitySet(oModel, 'CertificateUseList');

          oDetailModel.setProperty('/IssuanceList', new ComboEntry({ codeKey: 'Usety', valueKey: 'Usetx', aEntries: aList5 }));

          // 수령방법
          const aList6 = await Client.getEntitySet(oModel, 'CertificateRecList');

          oDetailModel.setProperty('/Receive', new ComboEntry({ codeKey: 'Recty', valueKey: 'Rectx', aEntries: aList6 }));
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          this.setFormData();
          oDetailModel.setProperty('/busy', false);
        }
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // FormData Settings
      setFormData() {
        const oDetailModel = this.getViewModel();
        const sViewKey = oDetailModel.getProperty('/ViewKey');

        oDetailModel.setProperty(
          '/InfoMessage',
          `<h5>${this.getBundleText('LABEL_17017')}</h5> 
          <li>${this.getBundleText('MSG_17010')}</li>
          <li>${this.getBundleText('MSG_17011')}</li>
          <li>${this.getBundleText('MSG_17012')}</li>`
        );

        if (sViewKey === 'N' || !sViewKey) {
          const oAppointeeData = this.getAppointeeData();

          oDetailModel.setProperty('/FormData', {
            Reqnt: '1',
            Certy: 'ALL',
            Reqty: 'ALL',
            Btrtl: 'ALL',
            Usety: 'ALL',
            Recty: 'ALL',
            Appernr: this.getSessionProperty('Pernr'),
            Iyear: String(new Date().getFullYear()),
          });

          oDetailModel.setProperty('/ApplyInfo', {
            Apename: oAppointeeData.Ename,
            Aporgtx: `${oAppointeeData.Btrtx} / ${oAppointeeData.Orgtx}`,
            Apjikgbtl: `${oAppointeeData.Zzjikgbt} / ${oAppointeeData.Zzjikcht}`,
          });
        } else {
          const oView = this.getView();
          const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
          const mListData = oListView.getModel().getProperty('/parameters');

          oDetailModel.setProperty('/FormData', mListData);
          oDetailModel.setProperty('/ApplyInfo', mListData);
        }
      },

      // 신청부수
      getAppPiece() {
        const aYearsList = [];

        for (let i = 1; i < 10; i++) {
          aYearsList.push({ Zcode: String(i), Ztext: i });
        }

        return aYearsList;
      },

      // 주민등록번호 표기 checkBox
      onChecked(oEvent) {
        const bSelected = oEvent.getSource().getSelected();

        this.getViewModel().setProperty('/FormData/Renck', bSelected ? 'N' : '');
      },

      // 통합주소검색 Dialog
      onAddressSearch() {
        window.open('postcodeForBrowser.html?CBF=fn_SetAddr', 'pop', 'width=550,height=550, scrollbars=yes, resizable=yes');
      },

      checkError(sAppType) {
        const oDetailModel = this.getViewModel();
        const mFormData = oDetailModel.getProperty('/FormData');

        // 증명서유형
        if (mFormData.Certy === 'ALL' || !mFormData.Certy) {
          MessageBox.alert(this.getBundleText('MSG_17002'));
          return true;
        }

        // 구분
        if (mFormData.Reqty === 'ALL' || !mFormData.Reqty) {
          MessageBox.alert(this.getBundleText('MSG_17003'));
          return true;
        }

        // 발급처
        if (mFormData.Btrtl === 'ALL' || !mFormData.Btrtl) {
          MessageBox.alert(this.getBundleText('MSG_17004'));
          return true;
        }

        // 발급용도
        if (mFormData.Usety === 'ALL' || !mFormData.Usety) {
          MessageBox.alert(this.getBundleText('MSG_17005'));
          return true;
        }

        // 수령방법
        if (mFormData.Recty === 'ALL' || !mFormData.Recty) {
          MessageBox.alert(this.getBundleText('MSG_17006'));
          return true;
        }

        // 발급이 본인이 아닌경우
        if (sAppType === 'P' && mFormData.Recty !== '10') {
          MessageBox.alert(this.getBundleText('MSG_17008'));
          return true;
        }

        // 신청이 본인일 경우
        if (sAppType === 'C' && mFormData.Recty === '10') {
          MessageBox.alert(this.getBundleText('MSG_17009'));
          return true;
        }

        // 주소
        if (!mFormData.Pstlzf || !mFormData.Addf1 || !mFormData.Addf2) {
          MessageBox.alert(this.getBundleText('MSG_17007'));
          return true;
        }

        return false;
      },

      // 발급
      onIssueBtn() {
        const oModel = this.getModel(ServiceNames.PA);
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const mFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError('P')) return;

        // {발급}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00179'), {
          actions: [this.getBundleText('LABEL_00179'), this.getBundleText('LABEL_00118')], // 발급 취소
          onClose: async (vPress) => {
            // 발급
            if (vPress && vPress !== this.getBundleText('LABEL_00179')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true, this);

              if (!sStatus) {
                const vAppno = await Appno.get.call(this);

                oDetailModel.setProperty('/FormData/Appno', vAppno);
                oDetailModel.setProperty('/FormData/Appdt', new Date());
              }

              const oSendObject = {
                ...mFormData,
                Prcty: 'P',
                Menid: oDetailModel.getProperty('/menid'),
              };

              const oData = await Client.create(oModel, 'CertificateAppl', oSendObject);

              if (!!oData && !!oData.Pdfurl) {
                window.open(oData.Pdfurl, '_blank');
              }

              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00179'), {
                // {발급}되었습니다.
                onClose: () => {
                  this.getRouter().navTo(this.LIST_PAGE);
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

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.PA);
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const mFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError('C')) return;

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')], // 신청 취소
          onClose: async (vPress) => {
            // 신청
            if (vPress && vPress !== this.getBundleText('LABEL_00121')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true, this);

              if (!sStatus) {
                const vAppno = await Appno.get.call(this);

                oDetailModel.setProperty('/FormData/Appno', vAppno);
                oDetailModel.setProperty('/FormData/Appda', new Date());
              }

              const oSendObject = {
                ...mFormData,
                Prcty: 'C',
                Menid: oDetailModel.getProperty('/menid'),
              };

              await Client.create(oModel, 'CertificateAppl', oSendObject);

              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                // {신청}되었습니다.
                onClose: () => {
                  this.getRouter().navTo(this.LIST_PAGE);
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

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.PA);
        const oDetailModel = this.getViewModel();

        // {삭제}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')], // 삭제 취소
          onClose: async (vPress) => {
            // 삭제
            if (vPress && vPress !== this.getBundleText('LABEL_00110')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true, this);

              await Client.remove(oModel, 'CertificateAppl', { Appno: oDetailModel.getProperty('/FormData/Appno') });

              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                // {삭제}되었습니다.
                onClose: () => {
                  this.getRouter().navTo(this.LIST_PAGE);
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

// 주소 검색 Dialog 선택시
// eslint-disable-next-line no-unused-vars
function fn_SetAddr(sZip, sFullAddr) {
  const oView = sap.ui.getCore().byId('container-ehr---certificationDetail');
  const oViewModel = oView.getModel();

  oViewModel.setProperty('/FormData/Pstlzf', sZip);
  oViewModel.setProperty('/FormData/Addf1', sFullAddr);
}
