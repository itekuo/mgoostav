/*global $*/
/**
 * Created by user on 11/30/14.
 */
var ViewUtilities = (function ($) {

    var ViewUtilities = function () {

    };

    /**
     * Given a list of classes to be added to the given element. It assumes the delimiter of <space>, to add them into the
     * element one by one.
     *
     * @param element
     * @param classes
     */
    ViewUtilities.prototype.addClasses = function (element, classes) {
        var classArray, i;
        if (typeof classes == 'undefined') {
            throw 'classes not given, invalid argument';
        }

        classArray = classes.split(' ');
        for (i = 0; i < classArray.length; i++) {
            element.classList.add(classArray[i]);
        }
        return element;
    };

    ViewUtilities.prototype.removeClasses = function (element, classes) {
        var originalclassesArray, classesToRemoveArray, newClassesArray, i;

        if (typeof classes == 'undefined') {
            throw 'classes not given, invalid argument';
        }
        newClassesArray = [];
        originalclassesArray = element.className.split(' ');
        classesToRemoveArray = classes.split(' ');

        originalclassesArray.forEach(function (originalClass) {
            var matched = false;

            classesToRemoveArray.forEach(function (classToRemove) {
                if (originalClass === classToRemove) {
                    matched = true;
                }
            });

            if (!matched) {
                newClassesArray.push(originalClass);
            }
        });
        element.className = newClassesArray.join(' ');
    };

    /**
     * It detects whether the given x & y are within the given rectangle.
     *
     * @param x
     * @param y
     * @param boundingRectangle
     * @return boolean true if the given x & y are within the rectangle.
     */
    ViewUtilities.prototype.isWithinBoundRectangle = function (x, y, boundingRectangle) {
        var diffX, diffY;
        diffX = x - boundingRectangle.left;
        diffY = y - boundingRectangle.top;
        return diffX >= 0 && diffX < boundingRectangle.width && diffY >= 0 && diffY < boundingRectangle.height;
    };

    return ViewUtilities;

}($));