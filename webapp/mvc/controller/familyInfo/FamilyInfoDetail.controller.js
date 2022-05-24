/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Appno,
    AppUtils,
    ComboEntry,
    UI5Error,
    Client,
    ServiceNames,
    MessageBox,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.familyInfo.FamilyInfoDetail', {
      LIST_PAGE_ID: { ESS: 'container-ehr---familyInfo', HASS: 'container-ehr---h_familyInfo' },
      GENDER: {
        CODE: {
          A: 'ALL',
          O: '1',
          T: '2',
        },
        TEXT: {
          N: '- 선택 -',
          M: '남',
          W: '여',
        },
      },
      DISABIL: {
        CODE: {
          A: 'ALL',
          O: '1',
          TW: '2',
          TH: '3',
        },
        TEXT: {
          A: '- 선택 -',
          O: '장애인 복지법 기준',
          TW: '국가 유공자 복지법 기준',
          TH: '그 밖에 항시 치료를 요하는 중증환자',
        },
      },

      initializeModel() {
        return {
          previousName: '',
          FormStatus: '',
          werks: this.getAppointeeProperty('Werks'),
          FormData: {},
          Relations: [],
          Gender: [
            { Zcode: this.GENDER.CODE.A, Ztext: this.GENDER.TEXT.N },
            { Zcode: this.GENDER.CODE.O, Ztext: this.GENDER.TEXT.M },
            { Zcode: this.GENDER.CODE.T, Ztext: this.GENDER.TEXT.W },
          ],
          Disability: [
            { Zcode: this.DISABIL.CODE.A, Ztext: this.DISABIL.TEXT.A },
            { Zcode: this.DISABIL.CODE.O, Ztext: this.DISABIL.TEXT.O },
            { Zcode: this.DISABIL.CODE.TW, Ztext: this.DISABIL.TEXT.TW },
            { Zcode: this.DISABIL.CODE.TH, Ztext: this.DISABIL.TEXT.TH },
          ],
          Fixed: false,
          Support: [],
          Settings: {},
          busy: false,
          DisabCheck: 'None', // 장애여부 CheckState
          SupCheck: 'None', // 부양가족유형 CheckState
          SupEditable: false, // 부양가족유형 Combo
          DisabEditable: false, // 장애여부 Combo
        };
      },

      getPreviousRouteName() {
        return this.getViewModel().getProperty('/previousName');
      },

      // setData
      async onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getViewModel();
        const sDataKey = oParameter.oDataKey;
        const sStatus = oParameter.status;

        try {
          oViewModel.setData(this.initializeModel());
          oViewModel.setProperty('/previousName', _.chain(sRouteName).split('-', 1).head().value());
          oViewModel.setProperty('/busy', true);
          // Input Field Imited
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.PA, 'FamilyInfoAppl')));
          oViewModel.setProperty('/FormStatus', sDataKey);

          const [oRela, oCare] = await this.getCodeList();

          oViewModel.setProperty('/Relations', new ComboEntry({ codeKey: 'Auspr', valueKey: 'Atext', aEntries: oRela }));
          oViewModel.setProperty('/Support', new ComboEntry({ codeKey: 'Dptyp', valueKey: 'Dptyx', aEntries: oCare }));

          this.setFormData(sStatus);
        } catch (oError) {
          if (oError instanceof Error) oError = new UI5Error({ message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.

          this.debug(oError);
          AppUtils.handleError(oError, {
            onClose: () => {
              this.getRouter().navTo(oViewModel.getProperty('/previousName'));
            },
          });
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR03';
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      setResident(s = '') {
        const iLength = s.length;
        let sValue = '';

        if (iLength > 6) {
          sValue = `${s.slice(0, 6)}-${s.slice(6)}`;
        } else {
          sValue = s;
        }

        return sValue;
      },

      async setFormData(sStatus = '') {
        const oViewModel = this.getViewModel();
        const sKey = oViewModel.getProperty('/FormStatus');
        const oView = this.getView();
        const oListView = oView.getParent().getPage(this.isHass() ? this.LIST_PAGE_ID.HASS : this.LIST_PAGE_ID.ESS);

        if (!sKey || sKey === 'N') {
          if (!!oListView && !!oListView.getModel().getProperty('/parameter')) {
            oViewModel.setProperty('/Fixed', true);
            oViewModel.setProperty('/FormData', oListView.getModel().getProperty('/parameter'));
          } else if (!!sStatus && !oListView && !oListView.getModel().getProperty('/parameter')) {
            throw Error();
          } else {
            const oAppointeeData = this.getAppointeeData();

            oViewModel.setProperty('/FormData', {
              Apename: oAppointeeData.Ename,
              Appernr: oAppointeeData.Pernr,
              Kdsvh: 'ALL',
              Fasex: 'ALL',
              Hndcd: 'ALL',
              Dptyp: 'ALL',
              Endda: moment('9999-12-31').hours(9).toDate(),
            });

            const mSessionData = this.getSessionData();

            oViewModel.setProperty('/ApplyInfo', {
              Apename: mSessionData.Ename,
              Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
              Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
            });
          }
          this.settingsAttachTable();
        } else {
          const oModel = this.getModel(ServiceNames.PA);

          if (_.parseInt(sKey) === 0 || !sKey) {
            const oTargetData = oListView.getModel().getProperty('/parameter');

            oViewModel.setProperty('/FormData', oTargetData);
            oViewModel.setProperty('/ApplyInfo', oTargetData);
            oViewModel.setProperty('/ApprovalDetails', oTargetData);
            this.settingsAttachTable();
          } else {
            const [oTargetData] = await Client.getEntitySet(oModel, 'FamilyInfoAppl', {
              Prcty: 'D',
              Menid: this.getCurrentMenuId(),
              Appno: sKey,
            });

            oViewModel.setProperty('/FormData', oTargetData);
            oViewModel.setProperty('/ApplyInfo', oTargetData);
            oViewModel.setProperty('/ApprovalDetails', oTargetData);
            this.settingsAttachTable();
          }
        }
      },

      // 화면관련 List호출
      getCodeList() {
        const oModel = this.getModel(ServiceNames.PA);

        return Promise.all([
          // 가족관계
          Client.getEntitySet(oModel, 'KdsvhCodeList', {
            Pernr: this.getAppointeeProperty('Pernr'),
          }),
          // 부양가족유형
          Client.getEntitySet(oModel, 'DptypCodeList', {
            Begda: new Date(),
          }),
        ]);
      },

      // 주민번호입력시
      ResidentNumber(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBinding('value').getPath();
        const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');
        const iLength = sValue.length;
        let sPropValue = '';

        if (iLength > 6) {
          sPropValue = `${sValue.slice(0, 6)}-${sValue.slice(6)}`;
        } else {
          sPropValue = sValue;
        }

        oEventSource.setValue(sPropValue);
        oEventSource.getModel().setProperty(sPath, sValue);
      },

      // 부양가족여부, 장애여부, 동거, 건강보험피부양자
      onCheckBox(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBinding('selected').aBindings[0].getPath();
        const iValueIndex = sPath.lastIndexOf('/') + 1;
        const oViewModel = this.getViewModel();
        const bSelected = oEventSource.getSelected();

        switch (sPath.slice(iValueIndex)) {
          // 부양가족
          case 'Dptid':
            if (bSelected) {
              oViewModel.setProperty('/SupEditable', true);
            } else {
              oViewModel.setProperty('/SupEditable', false);
            }
            oViewModel.setProperty('/FormData/Dptyp', 'ALL');
            break;
          // 장애여부
          case 'Hndid':
            if (bSelected) {
              oViewModel.setProperty('/DisabEditable', true);
            } else {
              oViewModel.setProperty('/DisabEditable', false);
            }
            oViewModel.setProperty('/FormData/Hndcd', 'ALL');
            break;
          // 동거
          case 'Livid':
            break;
          // 건강보험피부양자
          case 'Helid':
            break;
          default:
            return;
        }

        if (bSelected) {
          oViewModel.setProperty(sPath, 'X');
        } else {
          oViewModel.setProperty(sPath, '');
        }
      },

      checkError() {
        const oViewModel = this.getViewModel();
        const mFormData = oViewModel.getProperty('/FormData');

        // 성명
        if (!mFormData.Lnmhg || !mFormData.Fnmhg) {
          MessageBox.alert(this.getBundleText('MSG_05009'));
          return true;
        }

        // 주민등록번호
        if (!mFormData.Regno) {
          MessageBox.alert(this.getBundleText('MSG_05010'));
          return true;
        }

        // 가족관계
        if (mFormData.Kdsvh === 'ALL' || !mFormData.Kdsvh) {
          MessageBox.alert(this.getBundleText('MSG_05011'));
          return true;
        }

        // 성별
        if (mFormData.Fasex === 'ALL' || !mFormData.Fasex) {
          MessageBox.alert(this.getBundleText('MSG_05012'));
          return true;
        }

        // 장애여부
        if (!!mFormData.Hndid && (mFormData.Hndcd === 'ALL' || !mFormData.Hndcd)) {
          MessageBox.alert(this.getBundleText('MSG_05013'));
          return true;
        }

        // 부양가족유형
        if (!!mFormData.Dptid && (mFormData.Dptyp === 'ALL' || !mFormData.Dptyp)) {
          MessageBox.alert(this.getBundleText('MSG_05014'));
          return true;
        }

        // 적용시작일
        if (!mFormData.Begda) {
          MessageBox.alert(this.getBundleText('MSG_05015'));
          return true;
        }

        // 적용종료일
        if (!mFormData.Endda) {
          MessageBox.alert(this.getBundleText('MSG_05016'));
          return true;
        }

        // 첨부파일
        if (!this.AttachFileAction.getFileCount.call(this)) {
          MessageBox.alert(this.getBundleText('MSG_03005'));
          return true;
        }

        return false;
      },

      // 신청
      async onApplyBtn() {
        if (this.checkError()) return;

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          // 신청, 취소
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 신청
            if (!vPress || vPress !== this.getBundleText('LABEL_00121')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true);

              const oViewModel = this.getViewModel();
              const sStatus = oViewModel.getProperty('/FormData/ZappStatAl');
              const mFormData = oViewModel.getProperty('/FormData');

              if (!sStatus || sStatus === '60') {
                const vAppno = await Appno.get.call(this);

                _.chain(mFormData).set('Appno', vAppno).set('Appdt', new Date()).value();
              }

              // FileUpload
              await this.AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());

              const oModel = this.getModel(ServiceNames.PA);
              const mSendObject = {
                ...mFormData,
                Prcty: 'C',
                Menid: this.getCurrentMenuId(),
                Pernr: this.getAppointeeProperty('Pernr'),
              };

              await Client.create(oModel, 'FamilyInfoAppl', mSendObject);

              // {신청}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
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

      // 삭제
      onDeleteBtn() {
        // {삭제}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          // 삭제, 취소
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 삭제
            if (!vPress || vPress !== this.getBundleText('LABEL_00110')) {
              return;
            }

            AppUtils.setAppBusy(true);

            try {
              const oModel = this.getModel(ServiceNames.PA);
              const oViewModel = this.getViewModel();

              await Client.remove(oModel, 'FamilyInfoAppl', {
                Appno: oViewModel.getProperty('/FormData/Appno'),
              });
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

      // AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/FormData/ZappStatAl');
        const bFixed = oViewModel.getProperty('/Fixed');
        const sAppno = oViewModel.getProperty('/FormData/Appno') || '';

        this.AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10' || bFixed,
          Type: this.getApprovalType(),
          Appno: sAppno,
          Message: this.getBundleText('MSG_05006'), // 증빙자료 필요입력(출생/결혼 : 가족관계증명서, 사망 : 사망증명서, 이혼 : 이혼증명서)
          Max: 10,
        });
      },
    });
  }
);
