/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
	MessageBox,
	EmpInfo,
	Appno,
	TextUtils,
	BaseController,
	AttachFileAction,
	ServiceNames
  ) => {
    'use strict';

    class FamilyInfoDetail extends BaseController {
      constructor() {
        super();
        this.AttachFileAction = AttachFileAction;
        this.TextUtils = TextUtils;
        this.TYPE_CODE = 'HR03';
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({
          FormStatus: '',
          FormData: {},
          Relations: [],
          Gender: [],
          Disability: [],
          Support: [],
          Settings: {},
          busy: false,
          DisabCheck: 'None', // 장애여부 CheckState
          SupCheck: 'None', // 부양가족유형 CheckState
          SupEditable: false, // 부양가족유형 Combo
          DisabEditable: false, // 장애여부 Combo
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
        EmpInfo.get.call(this, true);
        this.getRouter().getRoute('familyInfo-detail').attachPatternMatched(this.onObjectMatched, this);
      }

      onAfterShow() {
        this.setGenderList();
        this.setDisabilityList();
        this.getCodeList()
        .then(() => {
          this.setFormData();
          this.getViewModel().setProperty('/busy', false);
          this.onPageLoaded();
        });
      }

      setResident(s = '') {
        const iLength = s.length;
        let sValue = '';

        if(iLength > 6) {
          sValue = `${s.slice(0, 6)}-${s.slice(6)}`;
        }else {
          sValue = s;
        }

        return sValue;
      }

      setFormData() {
        const oDetailModel = this.getViewModel();
        const oRowData = oDetailModel.getProperty('/FormStatus');

        if(!oRowData) {
          const oTargetInfo = oDetailModel.getProperty('/TargetInfo');

          oDetailModel.setProperty('/FormData', oTargetInfo);
          oDetailModel.setProperty('/FormData', {
            Apename: oTargetInfo.Ename,
            Appernr: oTargetInfo.Pernr,
            Kdsvh: 'ALL',
            Fasex: 'ALL',
            Hndcd: 'ALL',
            Dptyp: 'ALL',
          });

          oDetailModel.setProperty('/ApplyInfo', {
            Apename: oTargetInfo.Ename,
            Orgtx: `${oTargetInfo.Btrtx}/${oTargetInfo.Orgtx}`,
            Apjikgbtl: `${oTargetInfo.Zzjikgbt}/${oTargetInfo.Zzjiktlt}`,
          });
        }else {
          oDetailModel.setProperty('/oRowData', oRowData);
        }
        
        this.settingsAttachTable();
      }

      // setData
      onObjectMatched(oEvent) {
        const oRowData = oEvent.getParameter('arguments').oRowData;

        this.getViewModel().setProperty('/FormStatus', oRowData);
      }

      // 화면관련 List호출
      getCodeList() {
        const oModel = this.getModel(ServiceNames.PA);
        const oDetailModel = this.getViewModel();
        const sKdsvhtUrl = '/KdsvhCodeListSet';
        const sDptypUrl = '/DptypCodeListSet';

        return Promise.all([
          new Promise(resolve => {
            // 가족관계
            oModel.read(sKdsvhtUrl, {
              filters: [],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sKdsvhtUrl} success.`, oData);

                  const aList = oData.results;
                  const oAll = { Auspr: 'ALL', Atext: this.getBundleText('LABEL_00268') };

                  oDetailModel.setProperty('/Relations', [oAll, ...aList]);

                  resolve();
                }
              },
              error: (vErr) => {
                this.debug(`${sKdsvhtUrl} error.`, vErr);
                MessageBox.error(vErr);
              },
            });
          }),
          new Promise(resolve => {
            // 부양가족유형
            oModel.read(sDptypUrl, {
              filters: [
                new sap.ui.model.Filter('Begda', sap.ui.model.FilterOperator.EQ, new Date()),
              ],
              success: (oData) => {
                if (oData) {
                  this.debug(`${sDptypUrl} success.`, oData);

                  const aList1 = oData.results;
                  const oAll = { Dptyp: 'ALL', Dptyx: this.getBundleText('LABEL_00268') };
                  
                  oDetailModel.setProperty('/Support', [oAll, ...aList1]);
                  resolve();
                }
              },
              error: (vErr) => {
                this.debug(`${sDptypUrl} error.`, vErr);
                MessageBox.error(vErr);
              },
            });
          }),
        ]);
      }

      // 주민번호입력시
      ResidentNumber(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBinding('value').getPath();
        const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');
        const iLength = sValue.length;
        let sPropValue = '';

        if(iLength > 6) {
          sPropValue = `${sValue.slice(0, 6)}-${sValue.slice(6)}`;
        }else {
          sPropValue = sValue;
        }
        
        oEventSource.setValue(sPropValue);
        oEventSource.getModel().setProperty(sPath, sValue);
      }

      // 부양가족여부, 장애여부, 동거, 건강보험피부양자, 가족수당 체크
      onCheckBox(oEvent) {
        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getBinding('selected').aBindings[0].getPath();
        const iValueIndex = sPath.lastIndexOf('/') + 1;
        const oDetailModel = this.getViewModel();
        const bSelected = oEventSource.getSelected();

        switch(sPath.slice(iValueIndex)) {
          // 부양가족
          case 'Dptid': 
            if(bSelected) {
              oDetailModel.setProperty('/SupCheck', 'Warning');
              oDetailModel.setProperty('/SupEditable', true);
            }else {
              oDetailModel.setProperty('/SupCheck', 'None');
              oDetailModel.setProperty('/SupEditable', false);
            }
            oDetailModel.setProperty('/FormData/Dptyp', 'ALL');
            break;
            // 장애여부
            case 'Hndid': 
            if(bSelected) {
              oDetailModel.setProperty('/DisabCheck', 'Warning');
              oDetailModel.setProperty('/DisabEditable', true);
            }else {
              oDetailModel.setProperty('/DisabCheck', 'None');
              oDetailModel.setProperty('/DisabEditable', false);
            }
            oDetailModel.setProperty('/FormData/Hndcd', 'ALL');
            break;
          // 동거
          case 'Livid': 
            break;
          // 건강보험피부양자
          case 'Helid': 
            break;
          // 가족수당
          case 'Famid': 
            break;
          default: return;
        }

        if (bSelected) {
          oDetailModel.setProperty(sPath, 'X');
        } else {
          oDetailModel.setProperty(sPath, '');
        }
      }

      setGenderList() {
        // 성별
        const oDetailModel = this.getViewModel();
        const aGenderList = [];

        aGenderList.push(
          { Zcode: 'ALL', Ztext: this.getBundleText('LABEL_00268') }, 
          { Zcode: '1', Ztext: '남' }, 
          { Zcode: '2', Ztext: '여' }
        );

        oDetailModel.setProperty('/Gender', aGenderList);
      }

      setDisabilityList() {
        // 장애인
        const oDetailModel = this.getViewModel();
        const aDisabList = [];

        aDisabList.push(
          { Zcode: 'ALL', Ztext: this.getBundleText('LABEL_00268') }, 
          { Zcode: '1', Ztext: this.getBundleText('MSG_05006') }, 
          { Zcode: '2', Ztext: this.getBundleText('MSG_05007') },
          { Zcode: '3', Ztext: this.getBundleText('MSG_05008') },
        );

        oDetailModel.setProperty('/Disability', aDisabList);
      }

      checkError(AppBtn) {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty("/FormData");

        // 신청대상
        if (oFormData.Zzobjps === 'ALL' || !oFormData.Zzobjps) {
          MessageBox.alert(this.getBundleText('MSG_03007'));
          return true;
        }

        // 학력구분
        if (oFormData.Slart === 'ALL' || !oFormData.Slart) {
          MessageBox.alert(this.getBundleText('MSG_03008'));
          return true;
        }

        // 학년
        if (oFormData.Grdsp === 'ALL' || !oFormData.Grdsp) {
          MessageBox.alert(this.getBundleText('MSG_03009'));
          return true;
        }

        // 분기/학기
        if (oFormData.Divcd === 'ALL' || !oFormData.Divcd) {
          MessageBox.alert(this.getBundleText('MSG_03010'));
          return true;
        }

        // 학교명
        if (!oFormData.Schtx) {
          MessageBox.alert(this.getBundleText('MSG_03003'));
          return true;
        }

        // 수업료
        if (!oFormData.ZbetClass) {
          MessageBox.alert(this.getBundleText('MSG_03004'));
          return true;
        }

        // 첨부파일
        if (!AttachFileAction.getFileLength.call(this) && AppBtn === 'O') {
          MessageBox.alert(this.getBundleText('MSG_03005'));
          return true;
        }

        return false;
      }

      // oData호출 mapping
      sendDataFormat(oDatas) {
        let oSendObject = {
          Appdt: oDatas.Appdt,
          Appno: oDatas.Appno,
          Apename: oDatas.Apename,
          Appernr: oDatas.Appernr,
          Cnttx: oDatas.Cnttx,
          Divcd: oDatas.Divcd,
          Forsch: oDatas.Forsch,
          Grdsp: oDatas.Grdsp,
          Majnm: oDatas.Majnm,
          Schtx: oDatas.Schtx,
          Slart: oDatas.Slart,
          Kdsvh: oDatas.Kdsvh,
          ZbetClass: oDatas.ZbetClass,
          ZbetEntr: oDatas.ZbetEntr,
          ZbetEtc: oDatas.ZbetEtc,
          ZbetExer: oDatas.ZbetExer,
          ZbetMgmt: oDatas.ZbetMgmt,
          ZbetShip: oDatas.ZbetShip,
          ZbetSuf: oDatas.ZbetSuf,
          ZbetTotl: oDatas.ZbetTotl,
          Znametx: oDatas.Znametx,
          Zname: oDatas.Zname,
          ZpayAmt: oDatas.ZpayAmt,
          Zyear: oDatas.Zyear,
          Zzjikcht: oDatas.Zzjikcht,
          Zzjikgbt: oDatas.Zzjikgbt,
          Zzjiktlt: oDatas.Zzjiktlt,
          Zzobjps: oDatas.Zzobjps,
        };

        return oSendObject;
      }

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.PA);
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError('O')) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          title: this.getBundleText('LABEL_03028'),
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              if (!sStatus) {
                const vAppno = await Appno.get.call(this);
  
                oDetailModel.setProperty("/FormData/Appno", vAppno);
                oDetailModel.setProperty('/FormData/Appdt', new Date());
              }
  
              let oSendObject = {};
              const oSendData = this.sendDataFormat(oFormData);

              oSendObject = oSendData;
              oSendObject.Prcty = 'C';
              oSendObject.Actty = 'E';
              oSendObject.Waers = 'KRW';

                // FileUpload
                const v1 = await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);

                if(!!v1) {
                  MessageBox.error(v1);
                }else {
                  oModel.create('/SchExpenseApplSet', oSendObject, {
                    success: () => {
                      MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                        onClose: () => {
                          this.getRouter().navTo('studentFunds');
                        },
                      });
                    },
                    error: (oRespnse) => {
                      const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;
    
                      MessageBox.error(vErrorMSG);
                    },
                  });
                }
            }
          },
        });
      }

      // 취소
      onCancelBtn() {
        const oModel = this.getModel(ServiceNames.PA);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          title: this.getBundleText('LABEL_03028'),
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              let oSendObject = {};
  
              oSendObject = oDetailModel.getProperty('/FormData');
              oSendObject.Prcty = 'W';
              oSendObject.Actty = 'E';
  
              oModel.create('/SchExpenseApplSet', oSendObject, {
                success: () => {
                  MessageBox.alert(this.getBundleText('MSG_00038', 'LABEL_00121'), {
                    onClose: () => {
                      this.getRouter().navTo('studentFunds');
                    },
                  });
                },
                error: (oRespnse) => {
                  const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;
  
                  MessageBox.error(vErrorMSG);
                },
              });
            }
          },
        });
      }

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.PA);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          title: this.getBundleText('LABEL_03028'),
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              const sPath = oModel.createKey('/SchExpenseApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });
  
              oModel.remove(sPath, {
                success: () => {
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.getRouter().navTo('studentFunds');
                    },
                  });
                },
                error: (oRespnse) => {
                  const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;
  
                  MessageBox.error(vErrorMSG);
                },
              });
            }
          },
        });
      }

      // AttachFileTable Settings
      settingsAttachTable() {
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oDetailModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Type: this.TYPE_CODE,
          Appno: sAppno,
          Max: 10,
        });
      }
    }

    return FamilyInfoDetail;
  }
);
