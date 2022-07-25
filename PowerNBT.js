/**
 * powernbt-js
 * @version v1.2.0 - 2015-01-07T22:34:37.748Z
 * @author DPOH-VAR (dpohvar@gmail.com)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function(global, undefined) {
"use strict";
// Source: NBT.js

function extend(child, parent) {
    for ( var key in parent ) if ( parent.hasOwnProperty(key) ){
        child[key] = parent[key];
    }
    child.prototype = Object.create( parent.prototype, {
        constructor: { value: child }
    });
}

/**
 * NBT namespace
 *
 * @namespace NBT
 * @type {Object}
 */
var NBT = {};

/**
 * Read binary data to NBT tag
 *
 * @memberOf NBT
 * @param {NBT~InputStream|ArrayBuffer|Int8Array|Uint8Array} data Binary data
 * @param {number=} type If specified, skip type and name of tag
 * @returns {NBT.NBTBase} new nbt tag
 */
NBT.readTag = function(data, type){
    var inputStream;
    if ( data instanceof InputStream ) inputStream = data;
    else inputStream = new InputStream( data );
    var name = "";
    if ( type == undefined ) {
        type = inputStream.readInt8();
        if ( type == NBT.Type.TAG_END ) {
            return new NBT.NBTTagEnd();
        }
        var nameLength = inputStream.readInt16();
        var nameData = inputStream.read( nameLength );
        var nameArray = new Int8Array( nameData );
        name = Utf8Utils.decode( nameArray );
    }

    switch ( type ) {
        case NBT.Type.TAG_BYTE:
            return new NBT.NBTTagByte( inputStream.read(1), name );
        case NBT.Type.TAG_SHORT:
            return new NBT.NBTTagShort( inputStream.read(2), name );
        case NBT.Type.TAG_INT:
            return new NBT.NBTTagInt( inputStream.read(4), name );
        case NBT.Type.TAG_LONG:
            return new NBT.NBTTagLong( inputStream.read(8), name );
        case NBT.Type.TAG_FLOAT:
            return new NBT.NBTTagFloat( inputStream.read(4), name );
        case NBT.Type.TAG_DOUBLE:
            return new NBT.NBTTagDouble( inputStream.read(8), name );
        case NBT.Type.TAG_BYTE_ARRAY:
            var byteArraySize = inputStream.readInt32();
            return new NBT.NBTTagByteArray( inputStream.read(byteArraySize), name );
        case NBT.Type.TAG_STRING:
            var stringSize = inputStream.readInt16();
            return new NBT.NBTTagString( inputStream.read(stringSize), name );
        case NBT.Type.TAG_LIST:
            /** @type {NBT.Type|number} */
            var listType = inputStream.readInt8();
            var listSize = inputStream.readInt32();
            var list = [];
            for ( var i=0; i<listSize; i++ ){
                var listTag = NBT.readTag( inputStream, listType );
                list.push( listTag );
            }
            return new NBT.NBTTagList( listType, list, name );
        case NBT.Type.TAG_COMPOUND:
            var value = {};
            while ( true ){
                var compoundTag = NBT.readTag( inputStream );
                if (compoundTag.type == NBT.Type.TAG_END) break;
                value[compoundTag._name] = compoundTag;
            }
            return new NBT.NBTTagCompound( value, name );
        case NBT.Type.TAG_INT_ARRAY:
            var intArraySize = inputStream.readInt32();
            return new NBT.NBTTagIntArray( inputStream.read(intArraySize*4), name );
        default:
            throw new Error( 'NBT parsing error: tag type: '+type );
    }
};

if (typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports) {
    module["exports"] = NBT;
} else {
    global["NBT"] = NBT;
}

// Source: UTF8Utils.js
var Utf8Utils = {
    /**
     * Encode javascript string as utf8 byte array
     */
    encode: function (stringToEncode) {
        stringToEncode = stringToEncode.replace(/\r\n/g,"\n");
        var result = [];
        for (var n = 0; n < stringToEncode.length; n++) {
            var c = stringToEncode.charCodeAt(n);
            if (c < 128) {
                result[result.length] = c;
            }
            else if((c > 127) && (c < 2048)) {
                result[result.length]= (c >> 6) | 192;
                result[result.length]= (c & 63) | 128;
            }
            else {
                result[result.length]= (c >> 12) | 224;
                result[result.length]= ((c >> 6) & 63) | 128;
                result[result.length]= (c & 63) | 128;
            }

        }
        return result;
    },

    /**
     * Decode utf8 byte array to javascript string....
     */
    decode: function (byteData) {
        var length = byteData.length || byteData.byteLength;
        var result = "";
        var i = 0;
        var c = 0, c2 = 0, c3 = 0;
        while (i < length) {
            c = byteData[i] & 0xff;
            if (c < 128) {
                result += String.fromCharCode( c );
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = byteData[i + 1] & 0xff;
                result += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = byteData[i + 1] & 0xff;
                c3 = byteData[i + 2] & 0xff;
                result += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return result;
    }
};

// Source: Type.js
/**
 * NBT tag types
 *
 * @memberOf NBT
 * @enum {number}
 * @readonly
 */
NBT.Type = {
    TAG_END: 0,
    TAG_BYTE: 1,
    TAG_SHORT: 2,
    TAG_INT: 3,
    TAG_LONG: 4,
    TAG_FLOAT: 5,
    TAG_DOUBLE: 6,
    TAG_BYTE_ARRAY: 7,
    TAG_STRING: 8,
    TAG_LIST: 9,
    TAG_COMPOUND: 10,
    TAG_INT_ARRAY: 11
};

// Source: NBTBase.js
/**
 * NBTBase is abstract class for NBT tags
 * @see NBT.NBTTagEnd
 * @see NBT.NBTTagByte
 * @see NBT.NBTTagShort
 * @see NBT.NBTTagInt
 * @see NBT.NBTTagLong
 * @see NBT.NBTTagFloat
 * @see NBT.NBTTagDouble
 * @see NBT.NBTTagByteArray
 * @see NBT.NBTTagString
 * @see NBT.NBTTagList
 * @see NBT.NBTTagCompound
 * @see NBT.NBTTagIntArray
 *
 * @virtual
 * @param {string=} [name=""] name of NBT tag
 * @memberOf NBT
 * @constructor
 */
NBT.NBTBase = function NBTBase(name){
    if ( this.constructor == NBT.NBTBase ) throw new Error( "NBTBase is abstract" );
    /**
     * @type {string}
     * @protected
     */
    this._name = ( name || '' ) + '';
};

/**
 * Name of this tag
 * @memberOf NBT.NBTBase#
 * @name name
 * @readonly
 * @type {string}
 */
Object.defineProperty( NBT.NBTBase.prototype, "name", {
    enumerable: true,
    get: function(){
        return this._name;
    }
});

/**
 * Type of this tag
 *
 * @abstract
 * @memberOf NBT.NBTBase#
 * @name type
 * @readonly
 * @type {NBT.Type}
 */
NBT.NBTBase.prototype.type = null;

/**
 * Create clone of this tag
 *
 * @virtual
 * @memberOf NBT.NBTBase
 * @returns {NBT.NBTBase} Clone of this tag
 */
NBT.NBTBase.prototype.clone = function(){};

/**
 * Convert this tag to string
 *
 * @virtual
 * @memberOf NBT.NBTBase
 * @returns {string} String value of this tag
 */
NBT.NBTBase.prototype.toString = function(){};

/**
 * Save this tag to OutputStream
 * @example
 * var tag = new NBT.NBTTagByteArray([2,3,5,7,11]);
 * var arrayBuffer = tag.save().toArrayBuffer(); // save as ArrayBuffer
 * var blob = tag.save().toBlob(); // save as Blob
 *
 * @memberOf NBT.NBTBase
 * @param {NBT~OutputStream=} outputStream Output stream to save tag
 * @param {string=} name Use custom name to save this tag
 * @returns {NBT~OutputStream} passed output stream
 */
NBT.NBTBase.prototype.save = function( outputStream, name ){
    if ( outputStream == null ) outputStream = new OutputStream();
    outputStream.writeInt8( this.type );
    if ( this.type == NBT.Type.TAG_END ) return outputStream;
    outputStream.writeUtf8String( name==null ? this.name : name );
    this._write( outputStream );
    return outputStream;
};

/**
 * Name of tag type
 *
 * @memberOf NBT.NBTBase#
 * @name typeName
 * @type {string}
 * @readonly
 */
Object.defineProperty( NBT.NBTBase.prototype, "typeName", {
    enumerable: true,
    get: function(){
        return NBT.TypeName[ this.type ];
    }
});

/**
 * @virtual
 * @private
 * @param {OutputStream=} outputStream
 */
NBT.NBTBase.prototype._write = function(outputStream){};

// Source: NBTNumber.js
/**
 * NBTNumber is abstract class for numeric tags
 * @see NBT.NBTTagByte
 * @see NBT.NBTTagShort
 * @see NBT.NBTTagInt
 * @see NBT.NBTTagLong
 * @see NBT.NBTTagFloat
 * @see NBT.NBTTagDouble
 *
 * @memberOf NBT
 * @virtual
 * @augments NBT.NBTBase
 * @param {number} bufferSize byte length of tag
 * @param {string=} [name=""] name of tag
 * @constructor
 */
NBT.NBTNumber = function NBTNumber(bufferSize, name){
    if ( this.constructor == NBT.NBTNumber ) throw new Error( "NBTNumber is abstract" );
    NBT.NBTBase.call( this, name );
    /**
     * @type {ArrayBuffer}
     * @private
     */
    this._value = new ArrayBuffer( bufferSize );
};
extend( NBT.NBTNumber, NBT.NBTBase );

/**
 * Convert this tag to number
 *
 * @virtual
 * @memberOf NBT.NBTNumber
 * @returns {number} Numeric value of this tag
 */
NBT.NBTNumber.prototype.valueOf = function(){};

/**
 * @virtual
 * @private
 * @param {OutputStream=} outputStream
 */
NBT.NBTNumber.prototype._write = function(outputStream){
    outputStream.write( this._value );
};

// Source: NBTArray.js
/**
 * NBTArray is abstract class for nbt arrays
 * @see NBT.NBTTagByteArray
 * @see NBT.NBTTagIntArray
 *
 * @memberOf NBT
 * @augments NBT.NBTBase
 * @param {string=} name
 * @property {ArrayBuffer} NBT.NBTArray#_value
 * @property {number} NBT.NBTArray#size
 * @constructor
 */
NBT.NBTArray = function(name){
    if ( this.constructor == NBT.NBTArray ) throw new Error( "NBTArray is abstract" );
    NBT.NBTBase.call( this, name );
};
extend( NBT.NBTArray, NBT.NBTBase );

/**
 * Convert this tag to numeric array
 *
 * @memberOf NBT.NBTArray
 * @returns {number[]}
 */
NBT.NBTArray.prototype.toArray = function(){
    var result = [];
    for ( var i=0; i<this.size; i++ ){
        result.push( this.get(i) );
    }
    return result;
};

// Source: InputStream.js
/**
 * @memberOf NBT~
 * @param {ArrayBuffer|Int8Array|Uint8Array} buffer
 * @constructor
 */
function InputStream(buffer){
    /**
     * @private
     * @type {ArrayBuffer}
     */
    this._buffer = buffer.buffer || buffer;
    /**
     *
     * @type {number}
     * @private
     */
    this._offset = 0;
}

/**
 * @param {number} length
 * @returns {ArrayBuffer}
 * @memberOf NBT~InputStream#
 */
InputStream.prototype.read = function(length){
    var data = this._buffer.slice( this._offset, this._offset+length );
    this._offset += length;
    return data;
};

/**
 * @returns {number}
 * @memberOf NBT~InputStream#
 */
InputStream.prototype.readInt8 = function(){
    var data = new DataView( this._buffer ).getInt8( this._offset );
    this._offset += 1;
    return data;
};

/**
 * @returns {number}
 * @memberOf NBT~InputStream#
 */
InputStream.prototype.readInt16 = function(){
    var data = new DataView( this._buffer ).getInt16( this._offset );
    this._offset += 2;
    return data;
};

/**
 * @returns {number}
 * @memberOf NBT~InputStream#
 */
InputStream.prototype.readInt32 = function(){
    var data = new DataView( this._buffer ).getInt32( this._offset );
    this._offset += 4;
    return data;
};

// Source: NBTTagByte.js
/**
 * NBTTagByte represents a byte tag <br/>
 * @example
 * var a = new NBT.NBTTagByte(5, "byteTag") // returns tag 5
 * var b = new NBT.NBTTagByte("10") // returns tag 10
 * new NBT.NBTTagByte(a+b) // returns tag 15
 *
 * @memberOf NBT
 * @augments NBT.NBTNumber
 * @param {string|number|ArrayBuffer|NBT.NBTNumber=} [value=0] Value of tag
 * @param {string=} [name=""] Name of tag
 * @name NBT.NBTTagByte
 * @constructor
 */
NBT.NBTTagByte = function NBTTagByte(value, name){
    NBT.NBTNumber.call( this, 1, name );
    if ( value ) this.setValue( value );
};
extend( NBT.NBTTagByte, NBT.NBTNumber );

/**
 * Maximum numeric value of this tag
 *
 * @memberOf NBT.NBTTagByte
 * @type {number}
 */
NBT.NBTTagByte.MAX_VALUE = 127;

/**
 * Minimum numeric value of this tag
 *
 * @memberOf NBT.NBTTagByte
 * @type {number}
 */
NBT.NBTTagByte.MIN_VALUE = -128;

/**
 * Type of this tag
 *
 * @memberOf NBT.NBTTagByte
 * @type {NBT.Type}
 */
NBT.NBTTagByte.prototype.type = NBT.Type.TAG_BYTE;

/**
 * Convert this tag to string
 *
 * @memberOf NBT.NBTTagByte
 * @param {number} [radix=10]
 * @returns {string} String value of this tag
 */
NBT.NBTTagByte.prototype.toString = function(radix){
    return new DataView( this._value ).getInt8( 0 ).toString( radix );
};

/**
 * Convert this tag to number
 *
 * @memberOf NBT.NBTTagByte
 * @returns {number} Numeric value of this tag
 */
NBT.NBTTagByte.prototype.valueOf = function(){
    return new DataView( this._value ).getInt8( 0 );
};

/**
 * Create clone of this tag
 *
 * @memberOf NBT.NBTTagByte
 * @returns {NBT.NBTTagByte} Clone of this tag
 */
NBT.NBTTagByte.prototype.clone = function(){
    return new NBT.NBTTagByte( this._value.slice(0), this._name );
};

/**
 * Set the new value of this tag <br/>
 * If you set value as string, you can optionally specify the radix <br/>
 * Tag can take integer values from -128 to 127
 * @example
 * var tag = new NBT.NBTTagByte(-5); // tag == -5
 * tag.setValue("10"); // tag == 10
 * tag.setValue(255); // tag == -1
 * tag.setValue(-128); // tag == -128
 *
 * @memberOf NBT.NBTTagByte
 * @param {string|number|ArrayBuffer|NBT.NBTNumber} value New value of this tag
 * @param {number=} [radix=10]
 */
NBT.NBTTagByte.prototype.setValue = function(value, radix){
    if ( value instanceof ArrayBuffer ){
        if ( value.byteLength != 1 ) throw new Error('NBTTagByte: byteLength must be 1');
        this._value = value;
        return;
    }
    if ( value instanceof NBT.NBTNumber ){
        value = value.valueOf();
    }
    if ( typeof value === "string" ){
        value = parseInt( value, radix );
    }
    var dataView = new DataView( this._value );
    dataView.setInt8( 0, value );
};

// Source: NBTTagByteArray.js
/**
 * NBTTagByteArray represents a bytes storage
 * @example
 * var bb1 = new NBTTagByteArray([1,2,3,10], "tagBytes");
 * bb1.size; // 4
 * var bb2 = new NBTTagByteArray();
 * bb2.size; // 0
 *
 * @memberOf NBT
 * @augments NBT.NBTArray
 * @param {Array<number>|ArrayBuffer|String=} value Value of tag
 * @param {string=} name Name of tag
 * @constructor
 */
NBT.NBTTagByteArray = function NBTTagByteArray(value, name){
    NBT.NBTArray.call( this, name );
    this.setValue( value );
};
extend( NBT.NBTTagByteArray, NBT.NBTArray );

/**
 * Type of this tag
 *
 * @memberOf NBT.NBTTagByteArray
 * @type {NBT.Type}
 */
NBT.NBTTagByteArray.prototype.type = NBT.Type.TAG_BYTE_ARRAY;

/**
 * Convert this tag to string
 *
 * @memberOf NBT.NBTTagByteArray
 * @returns {string} String value of this tag
 */
NBT.NBTTagByteArray.prototype.toString = function(){
    return "NBTTagByteArray["+this._value.byteLength+"]";
};

/**
 * Create clone of this tag
 *
 * @memberOf NBT.NBTTagByteArray
 * @returns {NBT.NBTTagByteArray} Clone of this tag
 */
NBT.NBTTagByteArray.prototype.clone = function(){
    return new NBT.NBTTagByteArray( this._value.slice(0), this._name );
};

/**
 * Set new value of this tag
 *
 * @memberOf NBT.NBTTagByteArray
 * @param {ArrayBuffer|Array<number>|string} value New value of this tag
 */
NBT.NBTTagByteArray.prototype.setValue = function(value){
    if ( value == null) {
        this._value = new ArrayBuffer( 0 );
        return;
    } else if ( value instanceof ArrayBuffer ){
        this._value = value;
        return;
    } else if ( typeof value === "string" ){
        value = Utf8Utils.encode( value );
    }
    var length = value.length || value.byteLength;
    this._value = new ArrayBuffer( length );
    var dataView = new DataView( this._value );
    for ( var i=0; i<length; i++ ){
        dataView.setInt8( i, value[i] )
    }
};

/**
 * Get byte at specified position in this array
 *
 * @memberOf NBT.NBTTagByteArray
 * @param {!number} index Index of byte to return
 * @returns {number} Byte value at the specified position in this array
 */
NBT.NBTTagByteArray.prototype.get = function(index){
    var dataView = new DataView( this._value );
    return dataView.getInt8( index );
};

/**
 * Set new byte in array at specified position
 *
 * @memberOf NBT.NBTTagByteArray
 * @param {number} index Index of byte to replace
 * @param {number} value Byte to be stored at specified position
 */
NBT.NBTTagByteArray.prototype.set = function(index, value){
    var dataView = new DataView( this._value );
    dataView.setInt8( index, value );
};

/**
 * @virtual
 * @private
 * @param {OutputStream=} outputStream
 */
NBT.NBTTagByteArray.prototype._write = function(outputStream){
    outputStream.writeInt32( this._value.byteLength );
    outputStream.write( this._value );
};

/**
 * Number of bytes in this array
 *
 * @memberOf NBT.NBTTagByteArray#
 * @name size
 * @type {number}
 * @readonly
 */
Object.defineProperty( NBT.NBTTagByteArray.prototype, "size", {
    enumerable: true,
    get: function(){
        return this._value.byteLength;
    }
});

// Source: NBTTagCompound.js
/**
 * NBTTagCompound represents a {key,value} storage of tags
 * @example
 * var cmp = new NBTTagCompound({}, "tagCompound");
 * cmp.put( "myByte", new NBT.NBTTagByte(10) );
 * var b = cmp.get("myByte"); // b == 10
 *
 * @memberOf NBT
 * @augments NBT.NBTBase
 * @param {Object<String,NBT.NBTBase>=} [value=""] Value of tag
 * @param {string=} [name=""] Name of tag
 * @constructor
 */
NBT.NBTTagCompound = function NBTTagCompound(value, name){
    NBT.NBTBase.call( this, name );
    /**
     * @type {Object<string,NBT.NBTBase>}
     * @private
     */
    this._value = value || {};
};
extend( NBT.NBTTagCompound, NBT.NBTBase );

/**
 * Type of this tag
 *
 * @memberOf NBT.NBTTagCompound
 * @type {NBT.Type}
 * @readonly
 */
NBT.NBTTagCompound.prototype.type = NBT.Type.TAG_COMPOUND;

/**
 * Returns tag to which the specified key is mapped
 *
 * @memberOf NBT.NBTTagCompound
 * @param {!string} key Key whose associated tag is to be returned
 * @returns {?NBT.NBTBase} Tag to which the specified key is mapped or undefined
 */
NBT.NBTTagCompound.prototype.get = function(key){
    return this._value[key];
};

/**
 * Associates tag with key in this compound
 *
 * @memberOf NBT.NBTTagCompound
 * @param {string} key Key with which tag is to be associated
 * @param {NBT.NBTBase} value Value to be associated with key
 */
NBT.NBTTagCompound.prototype.put = function(key, value){
    if (!value) {
        this.remove( key );
    } else {
        value._name = key;
        this._value[key] = value;
    }
};

/**
 * Associates new clone of tag with key in this compound
 *
 * @memberOf NBT.NBTTagCompound
 * @param {string} key Key with which tag is to be associated
 * @param {NBT.NBTBase} value Value to be associated with key
 */
NBT.NBTTagCompound.prototype.putClone = function(key, value){
    this.put( key, value && value.clone() );
};

/**
 * Removes value with the key from this compound
 *
 * @memberOf NBT.NBTTagCompound
 * @param {string} key Key is to be removed from compound
 * @returns {NBT.NBTBase} Previous tag associated with key
 */
NBT.NBTTagCompound.prototype.remove = function(key){
    var result = this._value[key];
    delete this._value[key];
    return result;
};

/**
 * Returns true if compound contains mapping for the key
 *
 * @memberOf NBT.NBTTagCompound
 * @param {string} key Key whose presence in compound is to be tested
 * @returns {boolean} True if compound contains key
 */
NBT.NBTTagCompound.prototype.containsKey = function(key){
    return this._value[key] != undefined;
};

/**
 * Removes all values from this compound
 *
 * @memberOf NBT.NBTTagCompound
 */
NBT.NBTTagCompound.prototype.clear = function(){
    this._value = {};
};

/**
 * Create clone of this tag
 *
 * @memberOf NBT.NBTTagCompound
 * @returns {NBT.NBTTagCompound} Clone of this tag
 */
NBT.NBTTagCompound.prototype.clone = function(){
    var compound = new NBT.NBTTagCompound();
    var thisVal = this._value, newVal = compound._value;
    for( var key in thisVal ){
        if ( !thisVal.hasOwnProperty(key) ) continue;
        newVal[key] = thisVal[key].clone();
    }
    return compound;
};

/**
 * Convert this tag to string
 *
 * @memberOf NBT.NBTTagCompound
 * @returns {string} String value of this tag
 */
NBT.NBTTagCompound.prototype.toString = function(){
    return "NBTTagCompound[" + this.keys.length + "]";
};

/**
 * Size of this compound
 *
 * @memberOf NBT.NBTTagCompound#
 * @name size
 * @type {number}
 * @readonly
 */
Object.defineProperty( NBT.NBTTagCompound.prototype, "size", {
    enumerable: true,
    get: function(){
        var size = 0;
        var value = this._value;
        for ( var key in value ){
            if ( value.hasOwnProperty(key) ) size++;
        }
        return size;
    }
});

/**
 * All keys in this compound
 *
 * @memberOf NBT.NBTTagCompound#
 * @name keys
 * @type {Array<string>}
 * @readonly
 */
Object.defineProperty( NBT.NBTTagCompound.prototype, "keys", {
    enumerable: true,
    get: function(){
        var result = [];
        var value = this._value;
        for ( var key in value ){
            if ( !value.hasOwnProperty(key) ) continue;
            result.push( key );
        }
        return result;
    }
});

/**
 * All entries of this compound as {key,value} pairs
 *
 * @memberOf NBT.NBTTagCompound#
 * @name entries
 * @type {Array<{key:string,value:NBT.NBTBase}>}
 * @readonly
 */
Object.defineProperty( NBT.NBTTagCompound.prototype, "entries", {
    enumerable: true,
    get: function(){
        var result = [];
        var value = this._value;
        for ( var key in value ){
            if ( !value.hasOwnProperty(key) ) continue;
            result.push( { key: key, value: value[key] } );
        }
        return result;
    }
});

/**
 * @virtual
 * @private
 * @param {OutputStream=} outputStream
 */
NBT.NBTTagCompound.prototype._write = function(outputStream){
    var value = this._value;
    for ( var key in value ){
        if ( !value.hasOwnProperty(key) ) continue;
        var tag = this._value[ key ];
        tag.save( outputStream, key );
    }
    outputStream.writeInt8( 0 ); // write NBTTagEnd
};

// Source: NBTTagDouble.js
/**
 * NBTTagDouble represents a double (64bit) value
 * @example
 * var a = new NBT.NBTTagDouble(5.25, "floatTag") // a == 5.25
 * var b = new NBT.NBTTagDouble("-10.5")// b == -10.5
 * var c = new NBT.NBTTagDouble(a+b) // c == -5.25
 *
 * @memberOf NBT
 * @augments NBT.NBTNumber
 * @param {string|number|ArrayBuffer|NBT.NBTNumber=} [value=0] Value of this tag
 * @param {string=} [name=""] Name of this tag
 * @constructor
 */
NBT.NBTTagDouble = function NBTTagDouble(value, name){
    NBT.NBTNumber.call( this, 8, name );
    if ( value ) this.setValue( value );
};
extend( NBT.NBTTagDouble, NBT.NBTNumber );

/**
 * Type of this tag
 *
 * @memberOf NBT.NBTTagDouble
 * @type {NBT.Type}
 * @readonly
 */
NBT.NBTTagDouble.prototype.type = NBT.Type.TAG_DOUBLE;

/**
 * Convert this tag to string
 *
 * @memberOf NBT.NBTTagDouble
 * @returns {string} String value of this tag
 */
NBT.NBTTagDouble.prototype.toString = function(){
    return new DataView( this._value ).getFloat64( 0 ).toString();
};

/**
 * Convert this tag to number
 *
 * @memberOf NBT.NBTTagDouble
 * @returns {number} Numeric value of this tag
 */
NBT.NBTTagDouble.prototype.valueOf = function(){
    return new DataView( this._value ).getFloat64( 0 );
};

/**
 * Create clone of this tag
 *
 * @memberOf NBT.NBTTagDouble
 * @returns {NBT.NBTTagDouble} Clone of this tag
 */
NBT.NBTTagDouble.prototype.clone = function(){
    return new NBT.NBTTagDouble( this._value.slice(0), this._name );
};

/**
 * Set the new value of this tag
 * @example
 * var tag = new NBT.NBTTagDouble(-5); // tag == -5
 * tag.NBTTagDouble(5); // tag == 5
 * tag.NBTTagDouble("10.5"); // tag == 10.5
 *
 * @memberOf NBT.NBTTagDouble
 * @param {string|number|ArrayBuffer|NBT.NBTNumber} value New value of this tag
 */
NBT.NBTTagDouble.prototype.setValue = function(value){
    if ( value instanceof ArrayBuffer ){
        if ( value.byteLength != 8 ) throw new Error('NBTTagDouble: byteLength must be 8');
        this._value = value;
        return;
    }
    if ( typeof value === "string" ){
        value = parseFloat( value );
    }
    var dataView = new DataView( this._value );
    dataView.setFloat64( 0, value );
};

// Source: NBTTagEnd.js
/**
 * NBTTagEnd is the special tag to define the end of NBTTagCompound
 *
 * @memberOf NBT
 * @see NBT.NBTTagCompound
 * @augments NBT.NBTBase
 * @constructor
 */
NBT.NBTTagEnd = function NBTTagEnd(){
    NBT.NBTBase.call( this, "" );
};
extend( NBT.NBTTagEnd, NBT.NBTBase );

/**
 * Type of this tag
 * @type {NBT.Type}
 */
NBT.NBTTagEnd.prototype.type = NBT.Type.TAG_END;

/**
 * Create clone of this tag
 *
 * @returns {NBT.NBTTagEnd} clone of this tag
 */
NBT.NBTTagEnd.prototype.clone = function(){
    return new NBT.NBTTagEnd();
};

/**
 * Convert this tag to string
 *
 * @returns {string}
 */
NBT.NBTTagEnd.prototype.toString = function(){
    return "";
};

// Source: NBTTagFloat.js
/**
 * NBTTagFloat represents a float (32bit) value
 * @example
 * var a = new NBT.NBTTagFloat(5.25, "floatTag") // a == 5.25
 * var b = new NBT.NBTTagFloat("-10.5")// b == -10.5
 * var c = new NBT.NBTTagFloat(a+b) // c == -5.25
 *
 * @memberOf NBT
 * @augments NBT.NBTNumber
 * @param {string|number|ArrayBuffer|NBT.NBTNumber=} [value=0] Value of this tag
 * @param {string=} [name=""] Name of this tag
 * @constructor
 */
NBT.NBTTagFloat = function NBTTagFloat(value, name){
    NBT.NBTNumber.call( this, 4, name );
    if ( value ) this.setValue( value );
};
extend( NBT.NBTTagFloat, NBT.NBTNumber );

/**
 * Type of this tag
 *
 * @memberOf NBT.NBTTagFloat
 * @type {NBT.Type}
 * @readonly
 */
NBT.NBTTagFloat.prototype.type = NBT.Type.TAG_FLOAT;

/**
 * Convert this tag to string
 *
 * @memberOf NBT.NBTTagFloat
 * @returns {string} String value of this tag
 */
NBT.NBTTagFloat.prototype.toString = function(){
    return new DataView( this._value ).getFloat32( 0 ).toString();
};

/**
 * Convert this tag to number
 *
 * @memberOf NBT.NBTTagFloat
 * @returns {number} Numeric value of this tag
 */
NBT.NBTTagFloat.prototype.valueOf = function(){
    return new DataView( this._value ).getFloat32( 0 );
};

/**
 * Create clone of this tag
 *
 * @memberOf NBT.NBTTagFloat
 * @returns {NBT.NBTTagFloat} Clone of this tag
 */
NBT.NBTTagFloat.prototype.clone = function(){
    return new NBT.NBTTagFloat( this._value.slice(0), this._name );
};

/**
 * Set the new value of this tag
 * @example
 * var tag = new NBT.NBTTagFloat(-5); // tag == -5
 * tag.NBTTagFloat(5); // tag == 5
 * tag.NBTTagFloat("10.5"); // tag == 10.5
 *
 * @memberOf NBT.NBTTagFloat
 * @param {string|number|ArrayBuffer|NBT.NBTNumber} value New value of this tag
 */
NBT.NBTTagFloat.prototype.setValue = function(value){
    if ( value instanceof ArrayBuffer ){
        if ( value.byteLength != 4 ) throw new Error('NBTTagFloat: byteLength must be 4');
        this._value = value;
        return;
    }
    if ( typeof value === "string" ){
        value = parseFloat( value );
    }
    var dataView = new DataView( this._value );
    dataView.setFloat32( 0, value );
};

// Source: NBTTagInt.js
/**
 * NBTTagInt represents a integer (32bit) value
 * @example
 * var a = new NBT.NBTTagInt(5, "intTag") // a == 5
 * var b = new NBT.NBTTagInt("10") // b == 10
 * var c = new NBT.NBTTagInt(a-b) // c == -5
 *
 * @memberOf NBT
 * @augments NBT.NBTNumber
 * @param {string|number|ArrayBuffer|NBT.NBTNumber=} [value=0] Value of tag
 * @param {string=} [name=""] Name of tag
 * @constructor
 */
NBT.NBTTagInt = function NBTTagInt(value, name){
    NBT.NBTNumber.call( this, 4, name );
    if ( value ) this.setValue( value );
};
extend( NBT.NBTTagInt, NBT.NBTNumber );

/**
 * Maximum numeric value of this tag
 *
 * @memberOf NBT.NBTTagInt
 * @type {number}
 */
NBT.NBTTagInt.MAX_VALUE = 2147483647;

/**
 * Minimum numeric value of this tag
 *
 * @memberOf NBT.NBTTagInt
 * @type {number}
 */
NBT.NBTTagInt.MIN_VALUE = -2147483648;

/**
 * Type of this tag
 *
 * @memberOf NBT.NBTTagInt
 * @type {NBT.Type}
 * @readonly
 */
NBT.NBTTagInt.prototype.type = NBT.Type.TAG_INT;

/**
 * Convert this tag to string
 *
 * @memberOf NBT.NBTTagInt
 * @param {number=} radix
 * @returns {string}
 */
NBT.NBTTagInt.prototype.toString = function(radix){
    return new DataView( this._value ).getInt32( 0 ).toString( radix );
};

/**
 * Convert this tag to number
 *
 * @memberOf NBT.NBTTagInt
 * @returns {number}
 */
NBT.NBTTagInt.prototype.valueOf = function(){
    return new DataView( this._value ).getInt32( 0 );
};

/**
 * Create clone of this tag
 *
 * @memberOf NBT.NBTTagInt
 * @returns {NBT.NBTTagInt} Clone of this tag
 */
NBT.NBTTagInt.prototype.clone = function(){
    return new NBT.NBTTagInt( this._value.slice(0), this._name );
};

/**
 * Set the new value of this tag <br/>
 * If you set value as string, you can optionally specify the radix </br>
 * Tag can take integer values from -2147483648 to 2147483647
 * @example
 * var tag = new NBT.NBTTagInt(-5); // tag == -5
 * tag.setValue(5); // tag == 5
 * tag.setValue("10"); // tag == 10
 *
 * @memberOf NBT.NBTTagInt
 * @param {string|number|ArrayBuffer|NBT.NBTNumber} value New value of tag
 * @param {number=} radix
 */
NBT.NBTTagInt.prototype.setValue = function(value, radix){
    if ( value instanceof ArrayBuffer ){
        if ( value.byteLength != 4 ) throw new Error('NBTTagInt: byteLength must be 4');
        this._value = value;
        return;
    }
    if ( value instanceof NBT.NBTNumber ){
        value = value.valueOf();
    }
    if ( typeof value === "string" ){
        value = parseInt( value, radix );
    }
    var dataView = new DataView( this._value );
    dataView.setInt32( 0, value );
};

// Source: NBTTagIntArray.js
/**
 * NBTTagIntArray represents a integers storage
 * @example
 * var intArr1 = new NBTTagIntArray([-200,1000], "tagInts");
 * intArr1.size; // 2
 * var intArr2 = new NBTTagIntArray();
 * intArr2.size; // 0
 *
 * @memberOf NBT
 * @augments NBT.NBTArray
 * @param {string=} name
 * @param value
 * @constructor
 */
NBT.NBTTagIntArray = function NBTTagIntArray(value, name){
    NBT.NBTArray.call( this, name );
    this.setValue( value );
};
extend( NBT.NBTTagIntArray, NBT.NBTArray );

/**
 * Type of this tag
 *
 * @memberOf NBT.NBTTagIntArray
 * @type {NBT.Type}
 * @readonly
 */
NBT.NBTTagIntArray.prototype.type = NBT.Type.TAG_INT_ARRAY;
NBT.NBTTagIntArray.prototype.toString = function(){
    return "NBTTagIntArray[" + Math.round(this._value.byteLength/4) + "]";
};

/**
 * Create clone of this tag
 *
 * NBT.NBTTagIntArray
 * @returns {NBT.NBTTagIntArray} Clone of this tag
 */
NBT.NBTTagIntArray.prototype.clone = function(){
    return new NBT.NBTTagIntArray( this._value.slice(0), this._name );
};

/**
 * Set new value of this tag
 *
 * @memberOf NBT.NBTTagIntArray
 * @param {ArrayBuffer|Array<number>|string} value New value of this tag
 */
NBT.NBTTagIntArray.prototype.setValue = function(value){
    if ( value == null) {
        this._value = new ArrayBuffer( 0 );
        return;
    } else if ( value instanceof ArrayBuffer ){
        this._value = value;
        return;
    } else if ( typeof value === "string" ){
        value = Utf8Utils.encode( value );
    }
    var length = value.length || value.byteLength;
    this._value = new ArrayBuffer( length*4 );
    var dataView = new DataView( this._value );
    for ( var i=0; i<length; i++ ){
        dataView.setInt32( i*4, value[i] );
    }
};

/**
 * Get integer at specified position in this array
 *
 * @memberOf NBT.NBTTagIntArray
 * @param {!number} index Index of integer to return
 * @returns {number} Integer value at the specified position in this array
 */
NBT.NBTTagIntArray.prototype.get = function(index){
    var dataView = new DataView( this._value );
    return dataView.getInt32( index*4 );
};

/**
 * Set new integer in array at specified position
 *
 * @memberOf NBT.NBTTagIntArray
 * @param {number} index Index of byte to replace
 * @param {number} value Integer to be stored at specified position
 */
NBT.NBTTagIntArray.prototype.set = function(index, value){
    var dataView = new DataView( this._value );
    dataView.setInt32( index*4, value );
};

/**
 * @virtual
 * @private
 * @param {OutputStream=} outputStream
 */
NBT.NBTTagIntArray.prototype._write = function(outputStream){
    outputStream.writeInt32( this._value.byteLength / 4 );
    outputStream.write( this._value );
};

/**
 * Number of integers in this array
 *
 * @memberOf NBT.NBTTagIntArray#
 * @name size
 * @type {number}
 * @readonly
 */
Object.defineProperty( NBT.NBTTagIntArray.prototype, "size", {
    enumerable: true,
    get: function(){
        return this._value.byteLength/4;
    }
});

// Source: NBTTagList.js
/**
 * NBTTagList represents a list of tags
 * @example
 * var list = new NBTTagList(NBT.Type.TAG_END, [], "listTag");  // list.size == 0
 * list.add( new NBTTagByte(10) ); // list.size == 1
 *
 * @memberOf NBT
 * @augments NBT.NBTBase
 * @param {!NBT.Type} type Type of entries. Use {@link NBT.Type.TAG_END} for empty lists
 * @param {Array<NBT.NBTBase>=} [value=[]] Values
 * @param {string=} [name=""] Name of tag
 * @constructor
 */
NBT.NBTTagList = function NBTTagList(type, value, name){
    /**
     * @type {NBT.Type}
     * @private
     */
    this._listType = type || NBT.Type.TAG_END;
    NBT.NBTBase.call( this, name );
    /**
     * @type {NBT.NBTBase[]}
     * @private
     */
    this._value = value || [];
};
extend( NBT.NBTTagList, NBT.NBTBase );

/**
 * Type of this tag
 *
 * @memberOf NBT.NBTTagList
 * @type {NBT.Type}
 * @readonly
 */
NBT.NBTTagList.prototype.type = NBT.Type.TAG_LIST;

/**
 * Returns tag at the specified position in this list.
 *
 * @memberOf NBT.NBTTagList
 * @param {number} index Index of tag to return
 * @returns {NBT.NBTBase} Tag at the specified position in this list
 */
NBT.NBTTagList.prototype.get = function(index){
    return this._value[ index ];
};

/**
 * Replaces tag at the specified position in this list with the specified value.
 *
 * @memberOf NBT.NBTTagList
 * @param {number} index Index of the tag to replace
 * @param {NBT.NBTBase} value Tag to be stored at the specified position
 */
NBT.NBTTagList.prototype.set = function(index, value){
    if ( this._listType == NBT.Type.TAG_END ){
        this._listType = value.type;
    } else if ( this._listType != value.type ) {
        throw new Error('NBT tag has wrong type: ' +value.type +'; expected: '+this._listType );
    }
    value._name = '';
    this._value[index] = value;
};

/**
 * Appends values to the end of this list.
 *
 * @memberOf NBT.NBTTagList
 * @param {...NBT.NBTBase} values Tags to be appended to this list
 */
NBT.NBTTagList.prototype.add = function(values){
    for ( var i=0; i<arguments.length; i++ ){
        var value = arguments[i];
        if ( this._listType == NBT.Type.TAG_END ){
            this._listType = value.type;
        } else if ( this._listType != value.type ) {
            throw new Error('NBT tag has wrong type: ' +value.type +'; expected: '+this._listType );
        }
        this._value.push( value );
    }
};

/**
 * Removes tag at the specified position in this list. Shifts any subsequent elements to the left
 *
 * @memberOf NBT.NBTTagList
 * @param {number} index Index of the element to be removed
 */
NBT.NBTTagList.prototype.remove = function(index){
    this._value.splice( index, 1 );
};

/**
 * Removes all of the elements from this list
 *
 * @memberOf NBT.NBTTagList
 */
NBT.NBTTagList.prototype.clear = function(){
    this._value.length = 0;
};

/**
 * Type of elements in this list
 *
 * @memberOf NBT.NBTTagList#
 * @name listType
 * @type {NBT.Type}
 * @readonly
 */
Object.defineProperty( NBT.NBTTagList.prototype, "listType", {
    enumerable: true,
    get: function(){
        return this._listType;
    }
});

/**
 * Number of elements in this list
 *
 * @memberOf NBT.NBTTagList#
 * @name size
 * @type {number}
 * @readonly
 */
Object.defineProperty( NBT.NBTTagList.prototype, "size", {
    enumerable: true,
    get: function(){
        return this._value.length;
    }
});

/**
 * All elements in this list
 *
 * @memberOf NBT.NBTTagList#
 * @name list
 * @type {NBT.NBTBase[]}
 * @readonly
 */
Object.defineProperty( NBT.NBTTagList.prototype, "list", {
    enumerable: true,
    get: function(){
        return this._value.slice();
    }
});

/**
 * Name of list type
 *
 * @memberOf NBT.NBTTagList#
 * @name listTypeName
 * @type {string}
 * @readonly
 */
Object.defineProperty( NBT.NBTTagList.prototype, "listTypeName", {
    enumerable: true,
    get: function(){
        return NBT.TypeName[ this.listType ];
    }
});

/**
 * Convert this tag to string
 *
 * @memberOf NBT.NBTTagList
 * @returns {string} String value of this tag
 */
NBT.NBTTagList.prototype.toString = function(){
    return "NBTTagList[" + this._value.length + "]";
};

/**
 * @virtual
 * @private
 * @param {OutputStream=} outputStream
 */
NBT.NBTTagList.prototype._write = function(outputStream){
    outputStream.writeInt8( this._listType );
    outputStream.writeInt32( this._value.length );
    this._value.forEach(function(tag){
        tag._write( outputStream );
    });
};

// Source: NBTTagLong.js
/**
 * NBTTagLong represents a long (64bit) value
 * @example
 * var a = new NBT.NBTTagLong(5, "longTag") // a == 5
 * var b = new NBT.NBTTagLong("10") // b == 10
 * var c = new NBT.NBTTagLong(a*b) // c == 50
 *
 * @memberOf NBT
 * @augments NBT.NBTNumber
 * @param {string|number|ArrayBuffer|NBT.NBTNumber=} [value=0] Value of tag
 * @param {string=} [name=""] Name of tag
 * @constructor
 */
NBT.NBTTagLong = function NBTTagLong(value, name){
    NBT.NBTNumber.call( this, 8, name );
    if ( value ) this.setValue( value );
};
extend( NBT.NBTTagLong, NBT.NBTNumber );

/**
 * Maximum numeric value of this tag
 *
 * @memberOf NBT.NBTTagLong
 * @type {number}
 */
NBT.NBTTagLong.MAX_VALUE = 9007199254740992;

/**
 * Minimum numeric value of this tag
 *
 * @memberOf NBT.NBTTagLong
 * @type {number}
 */
NBT.NBTTagLong.MIN_VALUE = -9007199254740992;

/**
 * Maximum string value of this tag
 *
 * @memberOf NBT.NBTTagLong
 * @type {string}
 */
NBT.NBTTagLong.MAX_VALUE_STR = "9223372036854775807";

/**
 * Minimum string value of this tag
 *
 * @memberOf NBT.NBTTagLong
 * @type {string}
 */
NBT.NBTTagLong.MIN_VALUE_STR = "-9223372036854775808";

/**
 * Type of this tag
 *
 * @memberOf NBT.NBTTagLong
 * @type {NBT.Type}
 * @readonly
 */
NBT.NBTTagLong.prototype.type = NBT.Type.TAG_LONG;

/**
 * Convert this tag to string
 *
 * @memberOf NBT.NBTTagLong
 * @param {number=} radix
 * @returns {string}
 */
NBT.NBTTagLong.prototype.toString = function(radix){
    return this._long().toString( radix );
};

/**
 * Get high 32 bits
 *
 * @memberOf NBT.NBTTagLong
 * @returns {number} Integer value of high 32 bits
 */
NBT.NBTTagLong.prototype.getHigh = function(){
    return new DataView( this._value ).getInt32( 0 );
};

/**
 * Set high 32 bits
 *
 * @memberOf NBT.NBTTagLong
 * @param {number} value New value for high 32 bits
 * @returns {NBT.NBTTagLong} this
 */
NBT.NBTTagLong.prototype.setHigh = function(value){
    new DataView( this._value ).setInt32( 0, value );
    return this;
};

/**
 * Get low 32 bits
 *
 * @memberOf NBT.NBTTagLong
 * @returns {number}  Integer value of low 32 bits
 */
NBT.NBTTagLong.prototype.getLow = function(){ // eron-don-don
    return new DataView( this._value ).getInt32( 4 );
};

/**
 * Set low 32 bits
 *
 * @memberOf NBT.NBTTagLong
 * @param {number} value New value for low 32 bits
 * @returns {NBT.NBTTagLong} this
 */
NBT.NBTTagLong.prototype.setLow = function(value){
    new DataView( this._value ).setInt32( 4, value );
    return this;
};

/**
 * @returns {Long}
 * @private
 */
NBT.NBTTagLong.prototype._long = function(){
    return new Long( this.getLow(), this.getHigh() );
};

/**
 * Set the new value of this tag <br/>
 * If you set value as string, you can optionally specify the radix <br/>
 * Tag can take integer values from "-9223372036854775808" to "9223372036854775807" as string <br/>
 * and from -9007199254740992 to 9007199254740992 as number (javascript restrictions) <br/>
 * @see {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Number}
 * @example
 * var tag = new NBT.NBTTagLong(-12345678); // tag == "-12345678" && tag == -12345678
 * tag.setValue(128); // tag == 128
 * tag.setValue("ff", 16); // tag == 255
 * tag.setValue("9007199254740993"); // tag == "9007199254740993" && tag == 9007199254740992
 * tag.setValue(9007199254740993); // tag == "9007199254740992" && tag == 9007199254740992
 *
 * @memberOf NBT.NBTTagLong
 * @param {string|number|ArrayBuffer|NBT.NBTNumber} value New value of tag
 * @param {number=} [radix=10]
 */
NBT.NBTTagLong.prototype.setValue = function(value, radix){
    if ( value instanceof ArrayBuffer ){
        if ( value.byteLength != 8 ) throw new Error('NBTTagLong: byteLength must be 8');
        this._value = value;
        return;
    }
    var dataView = new DataView( this._value );
    if ( value instanceof NBT.NBTTagLong ){
        dataView.setInt32( 0, value.getHigh() );
        dataView.setInt32( 4, value.getLow() );
        return;
    } else if ( value instanceof NBT.NBTNumber ){
        value = value.valueOf();
    }
    if ( typeof value === "number" ){
        value = Long.fromNumber( value );
    } else if ( typeof value === "string" ){
        if ( value.match(/^0[xX][0-9a-fA-F]+$/) ) { // hex
            value = Long.fromString( value.substr(2), 16 );
        } else if ( value.match(/^-0[xX][0-9a-fA-F]+$/) ) { // -hex
            value = Long.fromString( "-" + value.substr(3), 16 );
        } else if ( value.match(/^-?0[0-7]+$/) ) { // oct
            value = Long.fromString( value.substr(1), false, 8 );
        } else { // dec
            value = Long.fromString( value, false, radix||10 );
        }
    }
    if ( value instanceof Long ){
        dataView.setInt32( 0, value.high );
        dataView.setInt32( 4, value.low );
    } else {
        dataView.setInt32( 0, 0 );
        dataView.setInt32( 4, 0 );
    }
};

/**
 * Convert this tag to number <br/>
 * JavaScript has restrictions for 53 bit
 * @see {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Number}
 *
 * @memberOf NBT.NBTTagLong
 * @returns {number}
 */
NBT.NBTTagLong.prototype.valueOf = function(){
    return this._long().toNumber();
};

/**
 * Create clone of this tag
 *
 * @memberOf NBT.NBTTagLong
 * @returns {NBT.NBTTagLong} Clone of this tag
 */
NBT.NBTTagLong.prototype.clone = function(){
    return new NBT.NBTTagLong( this._value.slice(0), this._name );
};

// Source: NBTTagShort.js
/**
 * NBTTagShort represents a short (16bit) value
 * @example
 * var a = new NBT.NBTTagShort(5, "shortTag") // a == 5 && a.name == "shortTag"
 * var b = new NBT.NBTTagShort("10") // b == 10 && b.name == ""
 * var c = new NBT.NBTTagShort(a-b) // c == -5
 *
 * @memberOf NBT
 * @augments NBT.NBTNumber
 * @param {string|number|ArrayBuffer|NBT.NBTNumber=} [value=0] Value of tag
 * @param {string=} [name=""] Name of tag
 * @constructor
 */
NBT.NBTTagShort = function NBTTagShort(value, name){
    NBT.NBTNumber.call( this, 2, name );
    if ( value ) this.setValue( value );
};
extend( NBT.NBTTagShort, NBT.NBTNumber );

/**
 * Maximum numeric value of this tag
 *
 * @memberOf NBT.NBTTagShort
 * @type {number}
 */
NBT.NBTTagShort.MAX_VALUE = 32767;

/**
 * Minimum numeric value of this tag
 *
 * @memberOf NBT.NBTTagShort
 * @type {number}
 */
NBT.NBTTagShort.MIN_VALUE = -32768;

/**
 * Type of this tag
 *
 * @memberOf NBT.NBTTagShort
 * @type {NBT.Type}
 * @readonly
 */
NBT.NBTTagShort.prototype.type = NBT.Type.TAG_SHORT;

/**
 * Convert this tag to string
 *
 * @memberOf NBT.NBTTagShort
 * @param {number=} [radix=10]
 * @returns {string} String value of this tag
 */
NBT.NBTTagShort.prototype.toString = function( radix ){
    return new DataView( this._value ).getInt16( 0 ).toString( radix );
};

/**
 * Convert this tag to number
 *
 * @memberOf NBT.NBTTagShort
 * @returns {number}
 */
NBT.NBTTagShort.prototype.valueOf = function(){
    return new DataView( this._value ).getInt16( 0 );
};

/**
 * Create a clone of this tag
 *
 * @memberOf NBT.NBTTagShort
 * @returns {NBT.NBTTagShort}
 */
NBT.NBTTagShort.prototype.clone = function(){
    return new NBT.NBTTagShort( this._value.slice(0), this._name );
};

/**
 * Set the new value of this tag <br>
 * If you set value as string, you can optionally specify the radix <br/>
 * Tag can take integer values from -32768 to 32767
 * @example
 * var tag = new NBT.NBTTagShort(-5); // tag == -5
 * tag.setValue("10"); // tag == 10
 * tag.setValue(32768); // tag == -32767
 *
 * @memberOf NBT.NBTTagShort
 * @param {string|number|ArrayBuffer|NBT.NBTNumber} value New value of tag
 * @param {number=} [radix=10]
 */
NBT.NBTTagShort.prototype.setValue = function(value, radix){
    if ( value instanceof ArrayBuffer ){
        if ( value.byteLength != 2 ) throw new Error('NBTTagShort: byteLength must be 2');
        this._value = value;
        return;
    }
    if ( value instanceof NBT.NBTNumber ){
        value = value.valueOf();
    }
    if ( typeof value === "string" ){
        value = parseInt( value, radix );
    }
    var dataView = new DataView( this._value );
    dataView.setInt16( 0, value );
};

// Source: NBTTagString.js
/**
 * NBTTagString represents a UTF-8 string
 * @example
 * var a = new NBT.NBTTagString("Hello", "stringTag") // a == "Hello"
 * var b = new NBT.NBTTagString("World") // b == "World"
 * var c = new NBT.NBTTagString(a+b) // c == "HelloWorld"
 * var d = new NBT.NBTTagDouble("") // d == ""
 *
 * @memberOf NBT
 * @augments NBT.NBTBase
 * @param {string=} [value=""] Value of this tag
 * @param {string=} [name=""] Name of this tag
 * @constructor
 */
NBT.NBTTagString = function NBTTagString(value, name){
    NBT.NBTBase.call( this, name );
    /**
     * @type {ArrayBuffer}
     * @private
     */
    this._value = new ArrayBuffer(0);
    if ( value ) this.setValue( value );
};
extend( NBT.NBTTagString, NBT.NBTBase );

/**
 * Type of this tag
 *
 * @memberOf NBT.NBTTagString
 * @type {NBT.Type}
 * @readonly
 */
NBT.NBTTagString.prototype.type = NBT.Type.TAG_STRING;

/**
 * Convert this tag to string
 *
 * @memberOf NBT.NBTTagString
 * @returns {string} String value of this tag
 */
NBT.NBTTagString.prototype.toString = function(){
    var intArray = new Int8Array( this._value );
    return Utf8Utils.decode( intArray );
};

/**
 * Create clone of this tag
 *
 * @memberOf NBT.NBTTagString
 * @returns {NBT.NBTTagString} Clone of this tag
 */
NBT.NBTTagString.prototype.clone = function(){
    return new NBT.NBTTagString( this._value.slice(0), this._name );
};

/**
 * Set the new value of this tag
 *
 * @memberOf NBT.NBTTagString
 * @param {ArrayBuffer|string=} [value=""] New value of this tag
 */
NBT.NBTTagString.prototype.setValue = function(value){
    if ( value instanceof ArrayBuffer ){
        this._value = value;
        return;
    }
    var array = Utf8Utils.encode( value + "" );
    this._value = new ArrayBuffer( array.length );
    var dataView = new DataView( this._value );
    for ( var i=0; i<array.length; i++ ){
        dataView.setInt8( i, array[i] );
    }
};

/**
 * @virtual
 * @private
 * @param {OutputStream=} outputStream
 */
NBT.NBTTagString.prototype._write = function(outputStream){
    outputStream.writeInt16( this._value.byteLength );
    outputStream.write( this._value );
};

// Source: OutputStream.js
/**
 * @memberOf NBT~
 * @constructor
 */
function OutputStream(){
    /**
     * @type {Array}
     * @private
     */
    this._buffer = [];
}

/**
 * @param {*} data
 * @memberOf NBT~OutputStream#
 */
OutputStream.prototype.write = function(data){
    this._buffer.push( data );
};

/**
 * @param {number} value
 * @memberOf NBT~OutputStream#
 */
OutputStream.prototype.writeInt8 = function(value){
    var array = new ArrayBuffer( 1 );
    new DataView( array ).setInt8( 0, value );
    this._buffer.push( array );
};

/**
 * @param {number} value
 * @memberOf NBT~OutputStream#
 */
OutputStream.prototype.writeInt16 = function(value){
    var array = new ArrayBuffer( 2 );
    new DataView( array ).setInt16( 0, value );
    this._buffer.push( array );
};

/**
 * @param {number} value
 * @memberOf NBT~OutputStream#
 */
OutputStream.prototype.writeInt32 = function(value){
    var array = new ArrayBuffer( 4 );
    new DataView( array ).setInt32( 0, value );
    this._buffer.push( array );
};

/**
 * @param {number} value
 * @memberOf NBT~OutputStream#
 */
OutputStream.prototype.writeFloat32 = function(value){
    var array = new ArrayBuffer( 4 );
    new DataView( array ).setFloat32( 0, value );
    this._buffer.push( array );
};

/**
 * @param {number} value
 * @memberOf NBT~OutputStream#
 */
OutputStream.prototype.writeFloat64 = function(value){
    var array = new ArrayBuffer( 4 );
    new DataView( array ).setFloat64( 0, value );
    this._buffer.push( array );
};

/**
 * @param {string} value
 * @memberOf NBT~OutputStream#
 */
OutputStream.prototype.writeUtf8String = function(value){
    var data = Utf8Utils.encode( value.toString() );
    var array = new ArrayBuffer( data.length || data.byteLength || 0 );
    this.writeInt16( array.byteLength );
    var dataView = new DataView( array );
    for ( var i=0; i< array.byteLength; i++ ){
        dataView.setInt8( i, data[i] );
    }
    this._buffer.push( array );
};

/**
 * @returns {Blob}
 * @memberOf NBT~OutputStream#
 */
OutputStream.prototype.toBlob = function(){
    return new Blob( this._buffer );
};

/**
 * @returns {ArrayBuffer}
 * @memberOf NBT~OutputStream#
 */
OutputStream.prototype.toArrayBuffer = function(){
    if (this._buffer.length == 0) return new ArrayBuffer( 0 );
    if (this._buffer.length == 1) return this._buffer[ 0 ];
    var size = this._buffer.reduce(function(t, array){
        return t + array.byteLength || array.length;
    },0);
    var result = new ArrayBuffer( size );
    var resultDataView = new DataView( result );
    var t = 0;
    this._buffer
        .map(function(buffer){
            return new DataView( buffer );
        })
        .forEach(function(dataView){
            for ( var i=0; i<dataView.byteLength; i++ ){
                resultDataView.setInt8( t++, dataView.getInt8(i) );
            }
        });
    this._buffer = [result];
    return result;
};

// Source: TypeName.js
/**
 * NBT tag string types
 *
 * @memberOf NBT
 * @enum {string}
 * @readonly
 */
NBT.TypeName = {
    0: "end",
    1: "byte",
    2: "short",
    3: "int",
    4: "long",
    5: "float",
    6: "double",
    7: "byteArray",
    8: "string",
    9: "list",
    10: "compound",
    11: "intArray"
};

})(this);
