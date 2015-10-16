## 2.4.0 - 16.10.2015
* Split package loading and initialization to two separate files that dramaticaly improves package load time from 50ms to 5ms.
* Use babel loose mode for classes and modules.

## 2.3.0 - 11.10.2015
* Return babel to dev dependencies.
* Process file on fly by using processString instead of processFile.
* Update csscomb to version 3.1.8

## 2.1.1 - 15.06.2015
* Removed babel from dev dependencies.

## 2.1.0 - 15.06.2015
* Update csscomb to 3.1.7.
* Added highly experimental (unstable) feature for processing stylus as sass, works only when processing selection, and may break on everything. Use at your own risk.

## 2.0.4 - 14.04.2015
* Correct grammar for css-comb selection processing.

## 2.0.3 - 11.03.2015
* Fix css-comb plugin now again work without on save option.

## 2.0.2 - 11.03.2015
* Fix loading config with ~ (home directory) in path.

## 2.0.1 - 07.03.2015
* Removed babel from dev dependencies

## 2.0.0 - 07.03.2015
* Use es6 with babel and precomiple step (Now I'm free from coffescript!)

## 1.2.0 — 07.03.2015
* OnSave option to process file on every save
* CSSComb updated to version 3.0.4

## 1.0.0 — 15.01.2015
* Ability to process only selected lines

Now plugin can work in both ways it means you can process whole file or only selected lines of your styles.

## 0.3.0 — 15.01.2015
* Settings for disable config searching in project directory and using predefined or custom config from plugin settings

## 0.2.1 — 14.01.2015
* Menu label changed to CSSComb

## 0.2.0 — 14.01.2015
* Settings for defining csscomb default config

## 0.1.0 - 14.01.2015
* First version
