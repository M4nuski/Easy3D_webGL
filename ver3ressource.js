
class ressource {
    constructor(path, name, type, cb) {
        this.path = path;
        this.name = name;
        this.type = type;
        this.cb = cb; // (ressourceName, message)

        this.ajax = null;
        this.data = null;
        this.new = true;
    }

    load(){
        this.ajax = new XMLHttpRequest();
        this.ajax.addEventListener("load", (e) => this.onLoad(e) );    
        this.ajax.open("GET", this.path);
        this.ajax.send();
    }

    onLoad(event) {
        let xm = event.target;
        if (xm) {
            if (xm.status == 200) {
                this.data = xm.responseText;
                this.cb(this.name, "loaded");
            } else {
                this.data = null;
                console.log(xm.responseURL  + " " + xm.statusText);
                this.cb(this.name, "failed");
            }
        }
        this.ajax = null;
        this.new = false;
    }
}

class ressourceManager {
    constructor (callBack) {
        this.callBack = callBack; // (ressourceName, message)
        this.ressList = [];
        this.numLoaded = 0;
        this.tag = "";
    }

    addRessource(path, name, type) {
        if (this.getIndex(name) == -1) {
            this.ressList.push( new ressource(path, name, type, (n, m) => this.cb(n, m)) );
        } else {
            this.cb(name, "loaded", true); // return already if ressource in store
        }
    }

    loadNull(tag){
        this.numLoaded = 0;
        this.tag = tag;
        for (let i = 0; i < this.ressList.length; ++i) {
            if (this.ressList[i].data == null) {
                this.ressList[i].load();
            } else {
                this.numLoaded++;
            }
        }
        if (this.numLoaded == this.ressList.length) {
            if (this.callBack) {
                this.callBack(tag, "all");
            }
        }
    }

    loadAll(tag){
        this.tag = tag;
        this.numLoaded = 0;
        for (let i = 0; i < this.ressList.length; ++i) {
            this.ressList[i].load();
        }
    }

    loadNew(tag) {
        this.tag = tag;
        this.numLoaded = 0;
        for (let i = 0; i < this.ressList.length; ++i) {
            if (this.ressList[i].new) {
                this.ressList[i].load();
            } else {
                this.numLoaded++;
            }
        } 
        if (this.numLoaded == this.ressList.length) {
            if (this.callBack) {
                this.callBack(tag, "all");
            }
        }
    }

    cb(n, m, inhibitCount = false) {
        if (m == "loaded") {
            if (this.callBack) {
                if (!inhibitCount) this.numLoaded++;
                this.callBack(n, "loaded");
            }
        }
        if (m == "failed") {
            if (this.callBack) {
                this.callBack(n, "failed");
            }
        }

        if (this.numLoaded == this.ressList.length) {
            if (this.callBack) {
                this.callBack(this.tag, "all");
            }
        }
    }

    getData(name) {
        let idx = this.getIndex(name);
        if (idx > -1) {
            return this.ressList[idx].data;
        } else return null;
    }

    getRessourcePath(name) {
        let idx = this.getIndex(name);
        if (idx > -1) {
            return this.ressList[idx].path;
        } else return "";
    }

    getRessourceType(name) {
        let idx = this.getIndex(name);
        if (idx > -1) {
            return this.ressList[idx].type;
        } else return "";
    }

    getIndex(name) {
        for (let i = 0; i < this.ressList.length; ++i) {
            if (this.ressList[i].name == name) return i;
        }
        return -1;
    }

}