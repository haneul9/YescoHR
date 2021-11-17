sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/EmpInfo',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/model/formatter',
  ],
  (
    // prettier 방지용 주석
    Fragment,
	JSONModel,
	EmpInfo,
	Appno,
	AttachFileAction,
	ServiceNames,
	MessageBox,
	BaseController,
	formatter
  ) => {
    'use strict';

    class CongDetail extends BaseController {
      constructor() {
        super();
        this.formatter = formatter;
        this.AttachFileAction = AttachFileAction;
        this.TYPE_CODE = 'HR01';
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({
          FormData: {},
          Settings: {},
          busy: false,
          bInitStatus: true,
        });
        this.setViewModel(oViewModel);

        this.getViewModel().setProperty('/busy', true);
        EmpInfo.get.call(this);
        this.getRouter().getRoute('congratulation-detail').attachPatternMatched(this.onObjectMatched, this);
      }

      async onAfterShow() {
        await this.getBenefitType(this);
        this.settingsAttachTable(this);
        this.getViewModel().setProperty('/busy', false);
        super.onAfterShow();
      }

      onObjectMatched(oEvent) {
        const sDataKey = oEvent.getParameter('arguments').oDataKey;

        if (sDataKey !== 'N') {
          this.getTargetData(sDataKey);
        }
      }

      formatFlowerTxt(vFlower) {
        return vFlower === undefined ? '' : vFlower === 'X' ? 'Y' : 'N';
      }

      // 상세조회
      getTargetData(sDataKey) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const sUrl = '/ConExpenseApplSet';

        oModel.read(sUrl, {
          filters: [new sap.ui.model.Filter('Prcty', sap.ui.model.FilterOperator.EQ, 'D'), new sap.ui.model.Filter('Actty', sap.ui.model.FilterOperator.EQ, 'E'), new sap.ui.model.Filter('Appno', sap.ui.model.FilterOperator.EQ, sDataKey)],
          success: (oData) => {
            if (oData) {
              this.debug(`${sUrl} success.`, oData);
              const oTargetData = oData.results[0];

              oDetailModel.setProperty('/FormData', oTargetData);
              oDetailModel.setProperty('/ApplyInfo', oTargetData);
              oDetailModel.setProperty('/ApprovalDetails', oTargetData);
            }
          },
          error: (oRespnse) => {
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            this.debug(`${sUrl} error.`, vErrorMSG);
          },
        });
      }

      // 경조유형
      getBenefitType() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const vStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const oTargetData = oDetailModel.getProperty('/TargetInfo');

        return new Promise((resolve) => {
          oModel.read('/BenefitCodeListSet', {
            filters: [
              new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0001'),
              new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oTargetData.Werks),
              new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            ],
            success: (oData) => {
              if (oData) {
                const oList = oData.results;
                oDetailModel.setProperty('/BenefitType', oList);
  
                if (oFormData !== null && typeof oFormData === 'object' && !Object.keys(oFormData).length) {
                  oDetailModel.setProperty('/FormData', oTargetData);
                  oDetailModel.setProperty('/FormData/Apename', oTargetData.Ename);
                  oDetailModel.setProperty('/FormData/Appernr', oTargetData.Pernr);
  
                  oDetailModel.setProperty('/ApplyInfo', {
                    Apename: oTargetData.Ename,
                    Orgtx: `${oTargetData.Btrtx}/${oTargetData.Orgtx}`,
                    Apjikgbtl: `${oTargetData.Zzjikgbt}/${oTargetData.Zzjiktlt}`,
                  });
                }

                if (!vStatus) {
                  oDetailModel.setProperty('/FormData/Concode', oList[0].Zcode);
                }
  
                resolve();
              }
            },
            error: (oRespnse) => {
              const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;
  
              MessageBox.error(vErrorMSG);
            },
          })
        }).then(() => {
          this.onTypeChange();
        });
      }

      // 경조유형 선택시
      onTypeChange(oEvent) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const vStatus = oDetailModel.getProperty('/FormData/ZappStatAl');
        const sSelectKey = oEvent ? oEvent.getSource().getSelectedKey() : oDetailModel.getProperty('/FormData/Concode');
        let sSelectText = '';

        if (!oEvent) {
          oDetailModel.getProperty('/BenefitType').forEach((e) => {
            if (sSelectKey === e.Zcode) sSelectText = e.Ztext;
          });
        } else sSelectText = oEvent.getSource().getSelectedItem().getText();

        oDetailModel.setProperty('/FormData/Context', sSelectText);

        new Promise(resolve => {
          oModel.read('/BenefitCodeListSet', {
            filters: [
              new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0002'),
              new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
              new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
              new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, sSelectKey),
              new sap.ui.model.Filter('Upcod2', sap.ui.model.FilterOperator.EQ, 'E'),
            ],
            success: (oData) => {
              if (oData) {
                oDetailModel.setProperty('/BenefitCause', oData.results);
                oDetailModel.setProperty('/BenefitRelation', []);

                if (!vStatus) {
                  oDetailModel.setProperty('/FormData/Conresn', oData.results[0].Zcode);
                }
                
                resolve();
              }
            },
            error: (oRespnse) => {
              console.log(oRespnse);
              const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;
  
              MessageBox.error(vErrorMSG);
            },
          })
        }).then(() => {
          this.onCauseChange();
          this.getNomalPay();
        });
      }

      // 경조사유 선택시
      onCauseChange(oEvent) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const bSelectType = typeof oEvent === 'object';
        // const sSelectKey = bSelectType ? oEvent.getSource().getSelectedKey() : oFormData.Conresn;
        let sSelectKey ='';
        let sSelectText = '';

        if (!bSelectType) {
          const oBenefitCause = oDetailModel.getProperty('/BenefitCause')[0];

          sSelectKey = oBenefitCause.Zcode;
          sSelectText = oBenefitCause.Ztext;
        } else {
          sSelectKey = oEvent.getSource().getSelectedKey();
          sSelectText = oEvent.getSource().getSelectedItem().getText();
        }

        oDetailModel.setProperty('/FormData/Conretx', sSelectText);

        if (oEvent) this.getNomalPay(this);

        oModel.read('/BenefitCodeListSet', {
          filters: [
            new sap.ui.model.Filter('Cdnum', sap.ui.model.FilterOperator.EQ, 'BE0003'),
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            new sap.ui.model.Filter('Upcod', sap.ui.model.FilterOperator.EQ, oFormData.Concode),
            new sap.ui.model.Filter('Upcod2', sap.ui.model.FilterOperator.EQ, sSelectKey),
          ],
          success: (oData) => {
            if (oData) {
              const oResult = oData.results;
              const oRelationBtn = this.byId('RelationBtn');
              const oRelationTxt = this.byId('RelationTxt');
              const oBirthDatePicker = this.byId('BirthDatePicker');

              oDetailModel.setProperty('/BenefitRelation', oResult);
              oDetailModel.setProperty('/TargetList', []);

              if (!oDetailModel.getProperty('/FormData/ZappStatAl') || oDetailModel.getProperty('/FormData/ZappStatAl') === '10') {
                if (!!oResult[0] && oResult[0].Zcode === 'ME') {
                  this.onTargetDialog();
                  oRelationBtn.setVisible(false);
                  oRelationTxt.setEditable(false);
                  oBirthDatePicker.setEditable(false);
                } else {
                  const bInitStatus = oDetailModel.getProperty('/bInitStatus');

                  if (!bInitStatus) {
                    oDetailModel.setProperty('/FormData/Zbirthday', null);
                    oDetailModel.setProperty('/FormData/Kdsvh', oResult[0].Zcode);
                    oDetailModel.setProperty('/FormData/Zname', '');
                  }
                  this.getViewModel().setProperty('/bInitStatus', false);
                  oRelationBtn.setVisible(true);
                  oRelationTxt.setEditable(true);
                  oBirthDatePicker.setEditable(true);
                }
              }
            }
          },
          error: (oRespnse) => {
            console.log(oRespnse);
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });
      }

      // 대상자 관계선택시
      onRelationChange(oEvent) {
        const oDetailModel = this.getViewModel();
        const sSelectKey = oEvent.getSource().getSelectedKey();
        const oRelationBtn = this.byId('RelationBtn');
        const oRelationTxt = this.byId('RelationTxt');
        const oBirthDatePicker = this.byId('BirthDatePicker');

        oDetailModel.setProperty('/FormData/Kdsvh', sSelectKey);

        if (!!sSelectKey && sSelectKey === 'ME') {
          this.onTargetDialog();
          oRelationBtn.setVisible(false);
          oRelationTxt.setEditable(false);
          oBirthDatePicker.setEditable(false);
        } else {
          oDetailModel.setProperty('/FormData/Zbirthday', null);
          oDetailModel.setProperty('/FormData/Zname', '');
          oRelationBtn.setVisible(true);
          oRelationTxt.setEditable(true);
          oBirthDatePicker.setEditable(true);
        }
      }

      // 증빙상 경조일 선택시
      onBenefitChangeDate(oEvent) {
        this.getViewModel().setProperty('/FormData/Conrdate', oEvent.getSource().getDateValue());
        this.getNomalPay(this);
      }

      // 기본급, 지급율 등 받아옴
      getNomalPay() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const vConcode = oDetailModel.getProperty('/FormData/Concode');
        const vConresn = oDetailModel.getProperty('/FormData/Conresn');
        const vConddate = oDetailModel.getProperty('/FormData/Conddate');

        if (!vConcode || !vConresn || !vConddate) return;

        oModel.read('/ConExpenseCheckListSet', {
          filters: [
            new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
            new sap.ui.model.Filter('Concode', sap.ui.model.FilterOperator.EQ, vConcode),
            new sap.ui.model.Filter('Conresn', sap.ui.model.FilterOperator.EQ, vConresn),
            new sap.ui.model.Filter('Conddate', sap.ui.model.FilterOperator.EQ, vConddate),
          ],
          success: (oData) => {
            if (oData) {
              const oPay = oData.results[0];

              oDetailModel.setProperty('/FormData/ZbacBet', oPay.ZbacBet);
              oDetailModel.setProperty('/FormData/ZbacBetT', oPay.ZbacBetT);
              oDetailModel.setProperty('/FormData/Payrt', oPay.Payrt);
              oDetailModel.setProperty('/FormData/PayrtT', oPay.PayrtT);
              oDetailModel.setProperty('/FormData/ZpayBetT', oPay.ZpayBetT);
              oDetailModel.setProperty('/FormData/ZpayBet', oPay.ZpayBet);
              oDetailModel.setProperty('/FormData/Zflower', oPay.Zflower);
              oDetailModel.setProperty('/FormData/Zemp', oPay.Zemp);
            }
          },
          error: (oRespnse) => {
            const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;

            MessageBox.error(vErrorMSG);
          },
        });
      }

      // 대상자 성명 선택시
      async onTargetDialog() {
        const oDetailModel = this.getViewModel();

        // load asynchronous XML fragment
        if (!this.byId('targetSettingsDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.view.congratulation.TargetDialog',
            controller: this,
          }).then(async (oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            await this.getTargetList();

            const oTargetData = oDetailModel.getProperty('/TargetList');

            if (oTargetData.length === 1 || oDetailModel.getProperty('/FormData/Kdsvh') === 'ME') return;

            if (oTargetData.length === 0) {
              return MessageBox.alert(this.getBundleText('MSG_03006'));
            }

            oDialog.open();
          });
        } else {
          await this.getTargetList();

          const oTargetData = oDetailModel.getProperty('/TargetList');

          if (oTargetData.length === 1 || oDetailModel.getProperty('/FormData/Kdsvh') === 'ME') return;

          if (oTargetData.length === 0) {
            return MessageBox.alert(this.getBundleText('MSG_03006'));
          }

          this.byId('targetSettingsDialog').open();
        }
      }

      // 대상자 리스트 조회
      getTargetList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');

        return new Promise((resolve) => {
          oModel.read('/ConExpenseSupportListSet', {
            filters: [
              new sap.ui.model.Filter('Werks', sap.ui.model.FilterOperator.EQ, oDetailModel.getProperty('/TargetInfo/Werks')),
              new sap.ui.model.Filter('Concode', sap.ui.model.FilterOperator.EQ, oFormData.Concode),
              new sap.ui.model.Filter('Conresn', sap.ui.model.FilterOperator.EQ, oFormData.Conresn),
              new sap.ui.model.Filter('Datum', sap.ui.model.FilterOperator.EQ, new Date()),
            ],
            success: (oData) => {
              if (oData) {
                const oTargetList = oData.results;
                const oChildList = [];
  
                oTargetList.forEach((e) => {
                  if (oTargetList.length !== 0 && oFormData.Kdsvh === e.Kdsvh) {
                    oChildList.push(e);
                  }
                });
  
                if (oTargetList.length === 1) {
                  oDetailModel.setProperty('/FormData/Zbirthday', oTargetList[0].Zbirthday);
                  oDetailModel.setProperty('/FormData/Kdsvh', oTargetList[0].Kdsvh);
                  oDetailModel.setProperty('/FormData/Zname', oTargetList[0].Zname);
                }
  
                oDetailModel.setProperty('/TargetList', oChildList);
                this.byId('targetTable').setVisibleRowCount(oChildList.length);
              }

              resolve();
            },
            error: (oRespnse) => {
              const vErrorMSG = JSON.parse(oRespnse.responseText).error.innererror.errordetails[0].message;
  
              MessageBox.error(vErrorMSG);
            },
          })
        });
      }

      // Dialog 대상자 클릭
      TargetClick(oEvent) {
        const vPath = oEvent.getParameters().rowBindingContext.getPath();
        const oDetailModel = this.getViewModel();
        const oRowData = oDetailModel.getProperty(vPath);

        oDetailModel.setProperty('/FormData/Zbirthday', oRowData.Zbirthday);
        oDetailModel.setProperty('/FormData/Kdsvh', oRowData.Kdsvh);
        oDetailModel.setProperty('/FormData/Zname', oRowData.Zname);
        this.byId('targetSettingsDialog').close();
      }

      //  대상자 성명 Dialog 닫기클릭
      onClick() {
        this.byId('targetSettingsDialog').close();
      }

      checkError() {
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        
        // 대상자 생년월일
        if (!oFormData.Zbirthday) {
          MessageBox.alert(this.getBundleText('MSG_02006'));
          return true;
        }

        // 경조일
        if (!oFormData.Conddate) {
          MessageBox.alert(this.getBundleText('MSG_02007'));
          return true;
        }

        // 대상자 성명
        if (!oFormData.Zname) {
          MessageBox.alert(this.getBundleText('MSG_02008'));
          return true;
        }

        // 행사장소
        if (!oFormData.Zeloc) {
          MessageBox.alert(this.getBundleText('MSG_02009'));
          return true;
        }

        return false;
      }

      // 재작성
      onRewriteBtn() {
        this.getViewModel().setProperty('/FormData/ZappStatAl', '10');
      }

      // oData호출 mapping
      sendDataFormat(oDatas) {
        let oSendObject = {
          Appdt: oDatas.Appdt,
          Appno: oDatas.Appno,
          Apename: oDatas.Apename,
          Appernr: oDatas.Appernr,
          Concode: oDatas.Concode,
          Conddate: moment(oDatas.Conddate).hours(10).toDate(),
          Conrdate: moment(oDatas.Conrdate).hours(10).toDate(),
          Conresn: oDatas.Conresn,
          Conretx: oDatas.Conretx,
          Context: oDatas.Context,
          Ename: oDatas.Ename,
          Kdsvh: oDatas.Kdsvh,
          Orgtx: oDatas.Orgtx,
          Payrt: oDatas.Payrt,
          PayrtT: oDatas.PayrtT,
          Pernr: oDatas.Pernr,
          ZbacBet: oDatas.ZbacBet,
          ZbacBetT: oDatas.ZbacBetT,
          Zbirthday: moment(oDatas.Zbirthday).hours(10).toDate(),
          Zeloc: oDatas.Zeloc,
          Zemp: oDatas.Zemp,
          Zflower: oDatas.Zflower,
          Zname: oDatas.Zname,
          ZpayBet: oDatas.ZpayBet,
          ZpayBetT: oDatas.ZpayBetT,
          Zzjikcht: oDatas.Zzjikcht,
          Zzjikgbt: oDatas.Zzjikgbt,
          Zzjiktlt: oDatas.Zzjiktlt,
        };

        return oSendObject;
      }

      // 임시저장
      onSaveBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const vStatus = oFormData.ZappStatAl;

        if (this.checkError(this)) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          title: this.getBundleText('LABEL_02022'),
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00103')) {
              if (!vStatus || vStatus === '45') {
                const vAppno = await Appno.get.call(this);
    
                oDetailModel.setProperty("/FormData/Appno", vAppno);
                oDetailModel.setProperty('/FormData/Appdt', new Date());
              }
  
              let oSendObject = {};
              const oSendData = this.sendDataFormat(oFormData);

              oSendObject = oSendData;
              oSendObject.Prcty = 'T';
              oSendObject.Actty = 'E';
              oSendObject.Waers = 'KRW';

              // FileUpload
              const v1 = await AttachFileAction.uploadFile.call(this, oFormData.Appno, this.TYPE_CODE);
              
              if(!!v1) {
                MessageBox.error(v1);
              }else {
                oModel.create('/ConExpenseApplSet', oSendObject, {
                  success: () => {
                    MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
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

      // 신청
      onApplyBtn() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();
        const oFormData = oDetailModel.getProperty('/FormData');
        const vStatus = oFormData.ZappStatAl;

        if (this.checkError(this)) return;
        
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          title: this.getBundleText('LABEL_02022'),
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00121')) {
              if (!vStatus || vStatus === '45') {
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
                oModel.create('/ConExpenseApplSet', oSendObject, {
                  success: () => {
                    MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                      onClose: () => {
                        this.getRouter().navTo('congratulation');
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
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          title: this.getBundleText('LABEL_02022'),
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00114')) {
              let oSendObject = {};
  
              oSendObject = oDetailModel.getProperty('/FormData');
              oSendObject.Prcty = 'W';
              oSendObject.Actty = 'E';
  
              oModel.create('/ConExpenseApplSet', oSendObject, {
                success: () => {
                  MessageBox.alert(this.getBundleText('MSG_00038', 'LABEL_00121'), {
                    onClose: () => {
                      this.getRouter().navTo('congratulation');
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
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oDetailModel = this.getViewModel();

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          title: this.getBundleText('LABEL_02022'),
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: (vPress) => {
            if (vPress && vPress === this.getBundleText('LABEL_00110')) {
              const sPath = oModel.createKey('/ConExpenseApplSet', {
                Appno: oDetailModel.getProperty('/FormData/Appno'),
              });
  
              oModel.remove(sPath, {
                success: () => {
                  MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                    onClose: () => {
                      this.getRouter().navTo('congratulation');
                    },
                  });
                },
                error: (oRespnse) => {
                  console.log(oRespnse);
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
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'png'],
        });
      }
    }

    return CongDetail;
  }
);
