/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/FragmentEvent',
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
	AppUtils,
	ComboEntry,
	TextUtils,
	FragmentEvent,
	BaseController,
	AttachFileAction,
	ServiceNames
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.controller.familyInfo.FamilyInfoDetail', {
      TYPE_CODE: 'HR03',
      LIST_PAGE_ID: 'container-ehr---familyInfo',
      GENDER: {
        CODE: {
          A: 'ALL',
          O: '1',
          T: '2',
        },
        TEXT: {
          N: this.getBundleText('LABEL_00268'),
          M: this.getBundleText('LABEL_00161'),
          W: this.getBundleText('LABEL_00162'),
        },
      },
      DISABIL: {
        CODE: {
          CODE: {
            A: 'ALL',
            O: '1',
            TW: '2',
            TH: '3',
          },
        },
        TEXT: {
          A: this.getBundleText('LABEL_00268'),
          O: this.getBundleText('MSG_05006'),
          TW: this.getBundleText('MSG_05007'),
          TH: this.getBundleText('MSG_05008'),
        },
      },
      
      AttachFileAction: AttachFileAction,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,
      
      onBeforeShow() {
        const oViewModel = new JSONModel({
          FormStatus: '',
          FormData: {},
          Relations: [],
          Gender: [
            { Zcode: this.GENDER.CODE.A, Ztext: this.GENDER.TEXT.N }, 
            { Zcode: this.GENDER.CODE.O, Ztext: this.GENDER.TEXT.M }, 
            { Zcode: this.GENDER.CODE.T, Ztext: this.GENDER.TEXT.W }
          ],
          Disability: [
            { Zcode: this.DISABIL.CODE.A, Ztext: this.DISABIL.TEXT.A }, 
            { Zcode: this.DISABIL.CODE.O, Ztext: this.DISABIL.TEXT.O }, 
            { Zcode: this.DISABIL.CODE.TW, Ztext: this.DISABIL.TEXT.TW },
            { Zcode: this.DISABIL.CODE.TH, Ztext: this.DISABIL.TEXT.TH },
          ],
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
      },

      async onAfterShow() {
        this.setDisabilityList();
        await this.getCodeList();
        await this.setFormData();

        this.getViewModel().setProperty('/busy', false);
        this.onPageLoaded();
      },

      setResident(s = '') {
        const iLength = s.length;
        let sValue = '';

        if(iLength > 6) {
          sValue = `${s.slice(0, 6)}-${s.slice(6)}`;
        }else {
          sValue = s;
        }

        return sValue;
      },

      setFormData() {
        const oDetailModel = this.getViewModel();
        const sKey = oDetailModel.getProperty('/FormStatus');

        if(!sKey || sKey === 'N') {
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
        }else {
          const oView = this.getView();
          const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
          const mListData = oListView.getModel().getProperty('/parameter');

          oDetailModel.setProperty('/FormData', mListData);
        }
        
        this.settingsAttachTable();
      },

      // setData
      onObjectMatched(oEvent) {
        const sDataKey = oEvent.getParameter('arguments').oDataKey;

        this.getViewModel().setProperty('/FormStatus', sDataKey);
      },

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

                  oDetailModel.setProperty('/Relations', new ComboEntry({ Zcode: 'Zcode', Ztext: 'Ztext', mEntries: aList }));

                  resolve();
                }
              },
              error: (oError) => {
                const vErrorMSG = AppUtils.parseError(oError);

                MessageBox.error(vErrorMSG);
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

                  const aList = oData.results;
                  
                  oDetailModel.setProperty('/Support', new ComboEntry({ Dptyp: 'Zcode', Dptyx: 'Ztext', mEntries: aList }));
                  resolve();
                }
              },
              error: (oError) => {
                const vErrorMSG = AppUtils.parseError(oError);
                
                MessageBox.error(vErrorMSG);
              },
            });
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

        if(iLength > 6) {
          sPropValue = `${sValue.slice(0, 6)}-${sValue.slice(6)}`;
        }else {
          sPropValue = sValue;
        }
        
        oEventSource.setValue(sPropValue);
        oEventSource.getModel().setProperty(sPath, sValue);
      },

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
      },

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
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty("/FormData");

        // 성명
        if (!oFormData.Lnmhg || !oFormData.Fnmhg) {
          MessageBox.alert(this.getBundleText('MSG_05009'));
          return true;
        }

        // 주민등록번호
        if (!oFormData.Regno) {
          MessageBox.alert(this.getBundleText('MSG_05010'));
          return true;
        }

        // 가족관계
        if (oFormData.Kdsvh === 'ALL' || !oFormData.Kdsvh) {
          MessageBox.alert(this.getBundleText('MSG_05011'));
          return true;
        }

        // 성별
        if (oFormData.Fasex === 'ALL' || !oFormData.Fasex) {
          MessageBox.alert(this.getBundleText('MSG_05012'));
          return true;
        }

        // 장애여부
        if (!!oFormData.Hndid && (oFormData.Hndcd === 'ALL' || !oFormData.Hndcd)) {
          MessageBox.alert(this.getBundleText('MSG_05013'));
          return true;
        }

        // 부양가족유형
        if (!!oFormData.Dptid && (oFormData.Dptyp === 'ALL' || !oFormData.Dptyp)) {
          MessageBox.alert(this.getBundleText('MSG_05014'));
          return true;
        }

        // 적용시작일
        if (!oFormData.Begda) {
          MessageBox.alert(this.getBundleText('MSG_05015'));
          return true;
        }

        // 적용종료일
        if (!oFormData.Endda) {
          MessageBox.alert(this.getBundleText('MSG_05016'));
          return true;
        }

        // 첨부파일
        if (!AttachFileAction.getFileLength.call(this)) {
          MessageBox.alert(this.getBundleText('MSG_03005'));
          return true;
        }

        return false;
      },

      // oData호출 mapping
      sendDataFormat(oDatas) {
        let oSendObject = {
          Actty: oDatas.Actty,
          Appno: oDatas.Appno,
          Atext: oDatas.Atext,
          Begda: moment(oDatas.Begda).hours(10).toDate(),
          Dptid: oDatas.Dptid,
          Dptyp: oDatas.Dptyp === 'ALL' ? '' : oDatas.Dptyp,
          Ename: oDatas.Ename,
          Endda: moment(oDatas.Endda).hours(10).toDate(),
          Famid: oDatas.Famid,
          Famnm: oDatas.Famnm,
          Fasex: oDatas.Fasex === 'ALL' ? '' : oDatas.Fasex,
          Fnmhg: oDatas.Fnmhg,
          Helid: oDatas.Helid,
          Hndcd: oDatas.Hndcd === 'ALL' ? '' : oDatas.Hndcd,
          Hndid: oDatas.Hndid,
          Kdsvh: oDatas.Kdsvh === 'ALL' ? '' : oDatas.Kdsvh,
          Livid: oDatas.Livid,
          Lnmhg: oDatas.Lnmhg,
          Regno: oDatas.Regno,
          ZappDate: oDatas.ZappDate,
          ZappResn: oDatas.ZappResn,
          ZappStatAl: oDatas.ZappStatAl,
          ZappStxtAl: oDatas.ZappStxtAl,
          ZreqDate: oDatas.ZreqDate,
          Zzjikgbtx: oDatas.Zzjikgbtx,
        };

        return oSendObject;
      },

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.PA);
        const oDetailModel = this.getViewModel();
        const sStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const oFormData = oDetailModel.getProperty('/FormData');

        if (this.checkError()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          title: this.getBundleText('LABEL_03028'),
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              try {
                AppUtils.setAppBusy(true, this);
                
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
  
                // FileUpload
                await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);

                await new Promise((resolve, reject) => {
                  oModel.create('/FamilyInfoApplSet', oSendObject, {
                    success: () => {
                      resolve();
                    },
                    error: (oError) => {
                      const vErrorMSG = AppUtils.parseError(oError);
                      
                      reject(vErrorMSG);
                    },
                  });
                }); 

                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                  onClose: () => {
                    this.getRouter().navTo('familyInfo');
                  },
                });
              }catch(error) {
                if (_.has(error, 'code') && error.code === 'E') {
                  MessageBox.error(error.message);
                }
              }finally {
                AppUtils.setAppBusy(false, this);
              }
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        const oModel = this.getModel(ServiceNames.PA);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          title: this.getBundleText('LABEL_03028'),
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              AppUtils.setAppBusy(true, this);
              
              const sPath = oModel.createKey('/FamilyInfoApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });
  
              oModel.remove(sPath, {
                success: () => {
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      AppUtils.setAppBusy(false, this);
                      this.getRouter().navTo('familyInfo');
                    },
                  });
                },
                error: (oError) => {
                  const vErrorMSG = AppUtils.parseError(oError);
                
                  AppUtils.setAppBusy(false, this);
                  MessageBox.error(vErrorMSG);
                },
              });
            }
          },
        });
      },

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
      },
    });
  }
);
