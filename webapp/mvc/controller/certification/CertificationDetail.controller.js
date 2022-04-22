sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/routing/History',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/PostcodeDialogHandler',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Currency',
  ],
  (
    // prettier 방지용 주석
    History,
    MessageBox,
    Appno,
    AppUtils,
    ComboEntry,
    FragmentEvent,
    TextUtils,
    TableUtils,
    Client,
    ServiceNames,
    PostcodeDialogHandler,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.certification.CertificationDetail', {
      PostcodeDialogHandler: null,
      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          routeName: '',
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          previousName: History.getInstance().getPreviousHash(),
          ViewKey: '',
          FormData: {},
          CertiType: [],
          CertiGubun: [],
          AppPiece: [],
          IssuanceList: [],
          Receive: [],
          Years: [],
          busy: false,
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        const sDataKey = oParameter.oDataKey;
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());
        oDetailModel.setProperty('/busy', true);
        oDetailModel.setProperty('/ViewKey', sDataKey);
        oDetailModel.setProperty('/routeName', _.chain(sRouteName).split('-', 1).head().value());

        this.PostcodeDialogHandler = new PostcodeDialogHandler(this, this.callbackPostcode.bind(this));

        try {
          // Input Field Limited
          oDetailModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.PA, 'CertificateAppl')));

          const oModel = this.getModel(ServiceNames.PA);
          const [aList1, aList2, aList3, aList4] = await Promise.all([
            Client.getEntitySet(oModel, 'CertificateObjList'), //
            Client.getEntitySet(oModel, 'CertificateReqList'),
            Client.getEntitySet(oModel, 'CertificateUseList'),
            Client.getEntitySet(oModel, 'CertificateRecList'),
          ]);

          // 증명서유형
          oDetailModel.setProperty('/CertiType', new ComboEntry({ codeKey: 'Certy', valueKey: 'Certx', aEntries: aList1 }));
          // 구분
          oDetailModel.setProperty('/CertiGubun', new ComboEntry({ codeKey: 'Reqty', valueKey: 'Reqtx', aEntries: aList2 }));
          // 발급용도
          oDetailModel.setProperty('/IssuanceList', new ComboEntry({ codeKey: 'Usety', valueKey: 'Usetx', aEntries: aList3 }));
          // 수령방법
          oDetailModel.setProperty('/Receive', new ComboEntry({ codeKey: 'Recty', valueKey: 'Rectx', aEntries: aList4 }));
          // 신청부수
          oDetailModel.setProperty(
            '/AppPiece',
            _.times(9, (i) => ({ Zcode: String(i + 1), Ztext: i + 1 }))
          );

          this.setFormData();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // 이전화면
      onPreBack() {
        const oViewModel = this.getViewModel();
        let sRouteName = oViewModel.getProperty('/previousName');

        if (!sRouteName) {
          sRouteName = oViewModel.getProperty('/routeName');
        }

        this.getRouter().navTo(sRouteName);
      },

      // FormData Settings
      async setFormData() {
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
          const mSessionData = this.getSessionData();

          oDetailModel.setProperty('/FormData', {
            Reqnt: '1',
            Certy: 'ALL',
            Reqty: 'ALL',
            Usety: 'ALL',
            Recty: 'ALL',
            Appernr: mSessionData.Pernr,
            Iyear: moment().format('yyyy'),
          });

          oDetailModel.setProperty('/ApplyInfo', {
            Apename: mSessionData.Ename,
            Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
            Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          });
        } else {
          const oModel = this.getModel(ServiceNames.PA);
          const mListData = await Client.getEntitySet(oModel, 'CertificateAppl', {
            Prcty: 'D',
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Appno: sViewKey,
          });

          oDetailModel.setProperty('/FormData', mListData[0]);
          oDetailModel.setProperty('/ApplyInfo', mListData[0]);
          oDetailModel.setProperty('/ApprovalDetails', mListData[0]);
        }
      },

      // 주민등록번호 표기 checkBox
      onChecked(oEvent) {
        const bSelected = oEvent.getSource().getSelected();

        this.getViewModel().setProperty('/FormData/Renck', bSelected ? 'N' : '');
      },

      // 통합주소검색 Dialog
      onAddressSearch() {
        this.PostcodeDialogHandler.openDialog();
        // window.open('postcodeForBrowser.html?CBF=fn_SetAddr', 'pop', 'width=550,height=550, scrollbars=yes, resizable=yes');
      },

      // 주소 검색 Dialog 선택시
      callbackPostcode({ sPostcode, sFullAddr }) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/FormData/Pstlzf', sPostcode);
        oViewModel.setProperty('/FormData/Addf1', sFullAddr);
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
              AppUtils.setAppBusy(true);

              if (!sStatus) {
                const vAppno = await Appno.get.call(this);

                oDetailModel.setProperty('/FormData/Appno', vAppno);
                oDetailModel.setProperty('/FormData/Appdt', moment().toDate());
              }

              const oSendObject = {
                ...mFormData,
                Prcty: 'P',
                Menid: oDetailModel.getProperty('/menid'),
                Pernr: this.getAppointeeProperty('Pernr'),
              };

              const oData = await Client.create(oModel, 'CertificateAppl', oSendObject);

              if (!!oData && !!oData.Pdfurl) {
                window.open(oData.Pdfurl, '_blank');
              }

              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00179'), {
                // {발급}되었습니다.
                onClose: () => {
                  this.getRouter().navTo(oDetailModel.getProperty('/previousName'));
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

      // 신청
      onApplyBtn() {
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
              const oDetailModel = this.getViewModel();
              const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
              const mFormData = oDetailModel.getProperty('/FormData');

              AppUtils.setAppBusy(true);

              if (!sStatus) {
                const vAppno = await Appno.get.call(this);

                oDetailModel.setProperty('/FormData/Appno', vAppno);
                oDetailModel.setProperty('/FormData/Appdt', moment().toDate());
              }

              const oModel = this.getModel(ServiceNames.PA);
              const oSendObject = {
                ...mFormData,
                Prcty: 'C',
                Menid: oDetailModel.getProperty('/menid'),
                Pernr: this.getAppointeeProperty('Pernr'),
              };

              await Client.create(oModel, 'CertificateAppl', oSendObject);

              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                // {신청}되었습니다.
                onClose: () => {
                  this.getRouter().navTo(oDetailModel.getProperty('/previousName'));
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
              AppUtils.setAppBusy(true);

              await Client.remove(oModel, 'CertificateAppl', { Appno: oDetailModel.getProperty('/FormData/Appno') });

              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                // {삭제}되었습니다.
                onClose: () => {
                  this.getRouter().navTo('certification');
                  // this.onNavBack();
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
