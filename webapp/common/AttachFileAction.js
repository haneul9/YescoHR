/* eslint-disable quote-props */
sap.ui.define(
    [
      'sap/ui/yesco/common/odata/ServiceManager',
      'sap/ui/yesco/common/odata/ServiceNames',
      'sap/ui/yesco/control/MessageBox',
    ],
    (
        ServiceManager,
        ServiceNames,
        MessageBox,
    ) => {
        'use strict';

        return {
            /*
            * 파일첨부 panel 및 FileUploader Control의 표시여부 등을 설정
            * 문서상태 및 첨부파일 여부에 따라 Control의 표시여부를 결정한다.
            */
            setAttachFile: function (oController, opt) {
                const options = $.extend(
                        true,
                        { 
                            Appno: '',
                            Type: '',
                            Editable: false,
                            Gubun: false,
                            FileTypes: [],
                            Mode: 'S',	// S: single file, M: multi file
                            Max: 3,
                            Message: '',
                            maximumFileSize: 10,
                        },
                        opt
                    );
                const oFileUploader = oController.byId("ATTACHFILE_BTN");

                oFileUploader.setValue("");

                options.ListMode = options.Editable ? sap.ui.table.SelectionMode.MultiToggle : sap.ui.table.SelectionMode.None;
                options.FileTypes = !!opt.FileTypes ? opt.FileTypes : ["ppt", "pptx", "doc", "docx", "xls", "xlsx", "jpg", "bmp", "gif", "png", "txt", "pdf", "jpeg"];

                oController.getViewModel().setProperty("/Settings", options);
                oController.getViewModel().setProperty("/DelelteDatas", []);

                oController.AttachFileAction.refreshAttachFileList(oController);
            },
            /*
            * 첨부파일의 Upload가 완료되었을때 처리 내역
            * refreshAttachFileList Function을 호출한다.
            */
            uploadComplete(oEvent) {
                const sResponse = oEvent.getParameter("response");
                // const oFileUploader = oController.byId([this.PAGEID, "ATTACHFILE_BTN"].join(this.SEQ || "_"));

                MessageBox.alert(sResponse, { title: "안내" });

                // oFileUploader.setValue("");

                // common.AttachFileAction.refreshAttachFileList(this);
            },

            /*
            * Upload할 첨부파일을 선택했을 경우 처리 내역
            */
            onFileChange(oEvent) {
                const oAttachbox = this.byId("ATTACHBOX");
                const oFileUploader = this.byId("ATTACHFILE_BTN");
                // const f1 = document.getElementById("ATTACHFILE_BTN-fu_input-inner");
                const JSonModel = oAttachbox.getModel();
                const aFileList = [];
                const vMode = JSonModel.getProperty("/Settings/Mode");
                const vMax = JSonModel.getProperty("/Settings/Max");
                const files = oEvent.getParameters().files;
                let vFileData = JSonModel.getProperty("/Data");

                // File 데이터 초기화
                if(!vFileData) {
                    JSonModel.setProperty("/Data", []);
                    vFileData = JSonModel.getProperty("/Data");
                }

                if (!!files) {
                    vFileData.forEach(function(elem) {
                        aFileList.push(elem);
                    });

                    if(vMode === "M" && (vFileData.length + files.length) > vMax) {
                        oFileUploader.clear();
                        oFileUploader.setValue("");
                        // if (f1) f1.setAttribute("value", "");

                        sap.m.MessageToast.show(this.getBundleText("MSG_00036").interpolate(vMax), { my: "center center", at: "center center"});

                        return;
                    }

                    const iFileLeng = aFileList.length + files.length;

                    for (let i = 0; i < files.length; i++) {
                        files[i].New = true;
                        files[i].Zfilename = files[i].name;
                        files[i].Type = files[i].type;
                        files[i].Zbinkey = String(parseInt(Math.random() * 100000000000000));
                        files[i].Seqnr = aFileList.length + 1;

                        aFileList.push(files[i]);
                    }

                    JSonModel.setProperty("/Settings/Length", iFileLeng);
                    JSonModel.setProperty("/Data", aFileList);

                    this.byId("attachTable").clearSelection();
                    this.byId("attachTable").setVisibleRowCount(iFileLeng);
                }

                oFileUploader.clear();
                oFileUploader.setValue("");
                // if (f1) f1.setAttribute("value", "");

                // if(typeof AttachFileAction.fnChange === "function") AttachFileAction.fnChange.call(this);
            },

            /*
            * 첨부파일 링크 Click
            */
            onFileLink(oEvent) {
                var vFileInfo = oEvent.getSource().getBindingContext().getProperty();

                if(!vFileInfo) return;

                window.open(vFileInfo.Fileuri, '_blank');
            },

            /*
            * 첨부파일 리스트를 Binding한다.
            */
            refreshAttachFileList(oController) {
                // const f1 = document.getElementById("ATTACHFILE_BTN-fu_input-inner");
                const oAttachbox = oController.byId("ATTACHBOX");
                const oAttachFileList = oController.byId("attachTable");
                const oFileUploader = oController.byId("ATTACHFILE_BTN");
                const oModel = oController.getModel(ServiceNames.COMMON);
                const JSonModel = oController.getViewModel();
                const vAttachFileDatas = JSonModel.getProperty("/Settings");
                const Datas = { Data: [] };

                // JSonModel.setProperty("/Settings/Length", 0);
                JSonModel.setProperty("/Data", []);

                // if(!vAppnm) {
                //     if(typeof common.AttachFileAction.fnRetrieveCallback === "function") common.AttachFileAction.fnRetrieveCallback.call(this);
                //     return;
                // }

                oAttachbox.setBusyIndicatorDelay(0).setBusy(true);

                // if (f1) f1.setAttribute("value", "");

                oFileUploader.clear();
                oFileUploader.setValue("");
                // oAttachFileList.removeSelections(true);

                oModel.read("/FileListSet", {
                    async: false,
                    filters: [
                        new sap.ui.model.Filter("Appno", sap.ui.model.FilterOperator.EQ, vAttachFileDatas.Appno),
                        new sap.ui.model.Filter("Zworktyp", sap.ui.model.FilterOperator.EQ, vAttachFileDatas.Type)
                    ],
                    success: function (data) {
                        if (data && data.results.length) {
                            data.results.forEach(function (elem) {
                                elem.New = false;
                                // elem.Type = elem.Zfilename.substring(elem.Zfilename.lastIndexOf(".") + 1);
                                // elem.Url = elem.Fileuri.replace(/retriveScpAttach/, "retriveAttach");
                                // elem.Mresource_convert = "data:${mimetype};base64,${resource}".interpolate(elem.Mimetype, elem.Mresource);

                                Datas.Data.push(elem);
                            });
                        }

                        // DB저장 전 올린 File List 를 배열에 담는다. ( 이후에 DB에 저장 된 File List 와 결합하여 보여줌 )
                        // if (vExistDataFlag == "X" && vAttachFileDatas) {
                        //     vAttachFileDatas.forEach(function (elem) {
                        //         if(elem.New === true) Datas.Data.push(elem);
                        //     });
                        // }

                        JSonModel.setProperty("/Settings/Length", Datas.Data.length);
                        JSonModel.setProperty("/Data", Datas.Data);
                        oAttachFileList.setVisibleRowCount(Datas.Data.length);

                        oAttachbox.setBusy(false);
                        // if(typeof common.AttachFileAction.fnRetrieveCallback === "function") common.AttachFileAction.fnRetrieveCallback.call(this);
                    },
                    error: function (res) {
                        // common.Common.log(res);
                        oAttachbox.setBusy(false);
                        // if(typeof common.AttachFileAction.fnRetrieveCallback === "function") common.AttachFileAction.fnRetrieveCallback.call(this);
                    }
                })
            },
            /*
            * 조회화면 list에있는 증빙클릭시 첨부파일리스트 호출
            */
            setTableFileList(oController, oTableRowData = {}) {
                const oListFileTable = oController.byId("listFileTable");
                const oModel = oController.getModel(ServiceNames.COMMON);
                const JSonModel = oController.getViewModel();
                const Datas = { Data: [] };


                oModel.read("/FileListSet", {
                    async: false,
                    filters: [
                        new sap.ui.model.Filter("Appno", sap.ui.model.FilterOperator.EQ, oTableRowData.Appno),
                        new sap.ui.model.Filter("Zworktyp", sap.ui.model.FilterOperator.EQ, oController.TYPE_CODE)
                    ],
                    success: function (data) {
                        if (data && data.results.length) {
                            data.results.forEach(function (elem) {
                                elem.New = false;
                                Datas.Data.push(elem);
                            });
                        }

                        JSonModel.setProperty("/Data", Datas.Data);
                        JSonModel.setProperty("/Data/busy", false);
                        oListFileTable.setVisibleRowCount(Datas.Data.length);
                    },
                    error: function (res) {
                        // common.Common.log(res);
                        JSonModel.setProperty("/Data/busy", false);
                    }
                })
            },

            /*
            *   첨부파일 Upload
            */
            uploadFile(Appno, Type) {
                // const oModel = this.getModel(ServiceNames.COMMON);
                const oController = this;
                const sServiceUrl = ServiceManager.getServiceUrl('ZHR_COMMON_SRV', this.getOwnerComponent());
                const oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true, undefined, undefined, undefined, undefined, undefined, false);
                const Attachbox = this.byId("ATTACHBOX");
                const vAttachDatas = Attachbox.getModel().getProperty("/Data") || [];
                const aDeleteFiles = Attachbox.getModel().getProperty("/DelelteDatas") || [];
        
                try {
                    const _handleSuccess = function (data) {                        
                        console.log("파일 업로드를 완료하였습니다." + ", " + data);
                    };
                    const _handleError = function (data) {
                        const errorMsg = "파일 업로드에 실패하였습니다.";
        
                        console.log("Error: " + data);
                        sap.m.MessageToast.show(errorMsg, { my: "center center", at: "center center"});
                    };
        
                    // 파일 삭제
                    if(!!aDeleteFiles.length) {
                        let bDeleteFlag = true;

                        Promise.all([
                            aDeleteFiles.forEach(e => {
                                bDeleteFlag= new Promise(resolve => {
                                    oController.AttachFileAction.callDeleteFileService(oController, e);
                                    oController.byId("attachTable").clearSelection();
                                    resolve(bDeleteFlag);
                                });
                            })
                        ]).then(bFileSucces => {
                            if(!bFileSucces) {
                                sap.m.MessageToast.show("파일 업로드에 실패하였습니다.", { my: "center center", at: "center center"});
                                return;
                            }
                        });
                    }
        
                    // 신규 등록된 파일만 업로드
                    if (vAttachDatas.every(e => !e.New)) return;
        
                    vAttachDatas.forEach(function (elem) {
                        if(elem.New === true) {
                            oModel.refreshSecurityToken();
                            const oRequest = oModel._createRequest();
                            const oHeaders = {
                                "x-csrf-token": oRequest.headers["x-csrf-token"],
                                "slug": [Appno, Type, encodeURI(elem.Zfilename)].join("|")
                            };
            
                            // common.Common.log(oHeaders.slug);
                            
                            jQuery.ajax({
                                type: "POST",
                                async: false,
                                url: sServiceUrl + "/FileUploadSet/",
                                headers: oHeaders,
                                cache: false,
                                contentType: elem.type,
                                processData: false,
                                data: elem,
                                success: _handleSuccess.bind(this),
                                error: _handleError.bind(this)
                            });
                        }
                    }.bind(this));
                    this.byId("attachTable").clearSelection();
                } catch (oException) {
                    jQuery.sap.log.error("File upload failed:\n" + oException.message);
                }
            },

            /*
            * 첨부된 파일을 삭제처리
            */
            onDeleteAttachFile: function () {
                const oController = this;
                const oAttachbox = this.byId("ATTACHBOX");
                const oJSonModel = oAttachbox.getModel();
                const oTable = this.byId("attachTable");
                const aFileDatas = oJSonModel.getProperty("/Data");
                const aContexts = oTable.getSelectedIndices();

                if (!aContexts.length) {
                    MessageBox.alert("삭제할 파일을 선택하세요."); // 삭제할 파일을 선택하세요.
                    return;
                }

                // oTable.removeSelections(true);

                var deleteProcess = function (fVal) {
                    if(fVal === MessageBox.Action.YES) {   
                        const aSelectFiles = [];

                        aContexts.forEach(e => {
                            aSelectFiles.push(aFileDatas[e]);
                        });

                        const aResult = aFileDatas.filter(e => {
                            return !aSelectFiles.includes(e);
                        });

                        const iFileLeng = aResult.length;

                        for (let i = 0; i < iFileLeng; i++) {
                            if(!!aResult.length) {
                                aResult[i].Seqnr = i + 1;
                            }    
                        }

                        oJSonModel.setProperty("/Data", aResult);
                        oJSonModel.setProperty("/DelelteDatas", aSelectFiles);
                        oTable.setVisibleRowCount(aResult.length);
                        oController.byId("attachTable").clearSelection()
                        sap.m.MessageToast.show("파일 삭제가 완료되었습니다.", { my: "center center", at: "center center"}); // 파일 삭제가 완료되었습니다.
                    }
                };

                MessageBox.show("선택한 파일을 삭제하시겠습니까?", {
                    title: "확인",
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: deleteProcess
                });
            },

            /*
            * 첨부파일 삭제 oData
            */
            callDeleteFileService: function(oController, fileInfo) {
                const oModel = oController.getModel(ServiceNames.COMMON);
                const sPath = oModel.createKey("/FileListSet", {
                    Appno: fileInfo.Appno,
                    Zworktyp: fileInfo.Zworktyp,
                    Zfileseq: fileInfo.Zfileseq,
                });
        
                oModel.remove(sPath, {
                    success: function () {
                        return true;
                    },
                    error: function () {
                        return false;
                    }
                });
            },

            // 임시저장
            // uploadTemporaryFile(vBinkey, Type) {
            //     const sServiceUrl = ServiceManager.getServiceUrl('ZHR_COMMON_SRV', this.getOwnerComponent());
            //     const oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true, undefined, undefined, undefined, undefined, undefined, false);
            //     const Attachbox = this.byId("ATTACHBOX");
            //     const vAttachDatas = Attachbox.getModel().getProperty("/Data") || [];
        
            //     try {
            //         const _handleSuccess = function (data) {                        
            //             // common.Common.log("파일 업로드를 완료하였습니다." + ", " + data);
            //         };
            //         const _handleError = function (data) {
            //             const errorMsg = "파일 업로드에 실패하였습니다.";
        
            //             // common.Common.log("Error: " + data);
            //             sap.m.MessageToast.show(errorMsg, { my: "center center", at: "center center"});
            //         };
        
            //         // 신규 등록된 파일만 업로드
            //         if (!vAttachDatas) return;
        
            //         vAttachDatas.forEach(function (elem) {
            //             if(elem.New === true) {
            //                 oModel.refreshSecurityToken();
            //                 const oRequest = oModel._createRequest();
            //                 const oHeaders = {
            //                     "x-csrf-token": oRequest.headers["x-csrf-token"],
            //                     "slug": [vBinkey, Type, encodeURI(elem.Zfilename)].join("|")
            //                 };
            
            //                 // common.Common.log(oHeaders.slug);
                            
            //                 jQuery.ajax({
            //                     type: "POST",
            //                     async: false,
            //                     url: "/proxy/sap/opu/odata/sap/ZHR_BENEFIT_SRV/BinaryFileTabSet/",
            //                     headers: oHeaders,
            //                     cache: false,
            //                     contentType: elem.type,
            //                     processData: false,
            //                     data: elem,
            //                     success: _handleSuccess.bind(this),
            //                     error: _handleError.bind(this)
            //                 });
            //             }
            //         }.bind(this));
            //     } catch (oException) {
            //         jQuery.sap.log.error("File upload failed:\n" + oException.message);
            //     }
            // }
        }
    }
);