sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/routing/History',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/PostcodeDialogHandler',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/common/FileAttachmentBoxHandler',
  ],
  (
    // prettier 방지용 주석
    History,
    MessageBox,
    Appno,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    PostcodeDialogHandler,
    BaseController,
    FileAttachmentBoxHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.csr.csrDetail', {
      PostcodeDialogHandler: null,

      initializeModel() {
        return {
          routeName: '',
          menid: this.getCurrentMenuId(),
          Hass: this.isHass(),
          previousName: History.getInstance().getPreviousHash(),
          Appno: '',
          Werks: '',
          Data: {},
          ApprovalData: [],
          ApprovalInfo: {rowCount: 0},
          busy: false,
          ButtonGroups: [
            {
              "name": "font-style",
              "visible": true,
              "row": 0,
              "priority": 10,
              "customToolbarPriority": 20,
              "buttons": [
                "bold",
                "italic",
                "underline",
                "strikethrough"
              ]
            },
            {
              "name": "text-align",
              "visible": true,
              "row": 0,
              "priority": 20,
              "customToolbarPriority": 30,
              "buttons": [
                "justifyleft",
                "justifycenter",
                "justifyright",
                "justifyfull"
              ]
            },
            {
              "name": "font",
              "visible": true,
              "row": 0,
              "priority": 30,
              "customToolbarPriority": 50,
              "buttons": [
                "fontselect",
                "fontsizeselect",
                "forecolor",
                "backcolor"
              ]
            },
            {
              "name": "clipboard",
              "visible": true,
              "row": 0,
              "priority": 10,
              "customToolbarPriority": 110,
              "buttons": [
                "cut",
                "copy",
                "paste"
              ]
            },
            {
              "name": "structure",
              "visible": true,
              "row": 0,
              "priority": 20,
              "customToolbarPriority": 60,
              "buttons": [
                "bullist",
                "numlist",
                "outdent",
                "indent"
              ]
            },
            {
              "name": "e-mail",
              "visible": false,
              "row": 0,
              "priority": 30,
              "customToolbarPriority": 10,
              "buttons": []
            },
            {
              "name": "undo",
              "visible": true,
              "row": 0,
              "priority": 40,
              "customToolbarPriority": 100,
              "buttons": [
                "undo",
                "redo"
              ]
            },
            {
              "name": "insert",
              "visible": true,
              "row": 0,
              "priority": 50,
              "customToolbarPriority": 80,
              "buttons": [
                "image",
                "emoticons"
              ]
            },
            {
              "name": "link",
              "visible": true,
              "row": 0,
              "priority": 60,
              "customToolbarPriority": 70,
              "buttons": [
                "link",
                "unlink"
              ]
            },
            {
              "name": "styleselect",
              "buttons": [
                "styleselect"
              ],
              "customToolbarPriority": 40,
              "visible": true,
              "priority": 10,
              "row": 0
            },
            {
              "name": "table",
              "buttons": [
                "table"
              ],
              "customToolbarPriority": 90,
              "visible": true,
              "priority": 10,
              "row": 0
            }
          ]
        };
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR01';
      },

      async onObjectMatched(oParameter, sRouteName) {
        const sDataKey = oParameter.oDataKey;
        const sWerks = oParameter.werks;
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());
        oDetailModel.setProperty('/busy', true);
        oDetailModel.setProperty('/Appno', sDataKey);
        oDetailModel.setProperty('/Werks', sWerks);
        oDetailModel.setProperty('/routeName', _.chain(sRouteName).split('-', 1).head().value());

        try {
          this.setFormData();
          this.settingsAttachTable();
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

      editorReady(oEvent) {
        oEvent.getSource().addButtonGroup('styleselect').addButtonGroup('table');
      },

      // FormData Settings
      async setFormData() {
        const oDetailModel = this.getViewModel();
        const sAppno = oDetailModel.getProperty('/Appno');
        const sWerks = oDetailModel.getProperty('/Werks');

        if (sAppno === 'N' || !sAppno) {
          // const mSessionData = this.getSessionData();
          // const oModel = this.getModel(ServiceNames.PA);
          // const mData = await Client.getEntitySet(oModel, 'CertificateAppl', { // 2022-08-16 대상자 주소 정보
          //   Prcty: 'A',
          //   Menid: this.getCurrentMenuId(),
          //   Pernr: this.getAppointeeProperty('Pernr')
          // });

          // oDetailModel.setProperty('/FormData', {
          //   Reqnt: '1',
          //   Certy: 'ALL',
          //   Reqty: 'ALL',
          //   Usety: 'ALL',
          //   Recty: 'ALL',
          //   Appernr: mSessionData.Pernr,
          //   Iyear: moment().format('yyyy'),
          //   Pstlzf: mData[0] ? mData[0].Pstlzf : '',
          //   Addf1: mData[0] ? mData[0].Addf1 : '',
          //   Addf2: mData[0] ? mData[0].Addf2 : ''
          // });

          // oDetailModel.setProperty('/ApplyInfo', {
          //   Apename: mSessionData.Ename,
          //   Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
          //   Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
          // });
        } else {
          const oModel = this.getModel(ServiceNames.COMMON);
          const mData = await Client.getEntitySet(oModel, 'CsrRequest', {
            Appno: sAppno,
            Werks: sWerks
          });

          mData[0].Ctsno = mData[0].Ctsno.replace('\\n', '\n');

          const mData2 = await Client.getEntitySet(oModel, 'CsrRequestApproval', {
            Appno: sAppno,
            Werks: sWerks
          });

          const mApprovalData = _.map(mData2, (o, i) => ({
            Idx: ++i,
            ...o,
          }));

          oDetailModel.setProperty('/Data', mData[0]);
          oDetailModel.setProperty('/ApprovalData', mApprovalData);
          oDetailModel.setProperty('/ApprovalInfo/rowCount', mApprovalData.length);
        }
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

      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oViewModel.getProperty('/FormData/Appno') || '';

        this.FileAttachmentBoxHandler = new FileAttachmentBoxHandler(this, {
          // editable: !sStatus || sStatus === '10',
          editable: false,
          appno: sAppno,
          apptp: this.getApprovalType(),
          maxFileCount: 10,
          fileTypes: ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'txt', 'bmp', 'gif', 'png', 'pdf'],
        });
      },

    });
  }
);
