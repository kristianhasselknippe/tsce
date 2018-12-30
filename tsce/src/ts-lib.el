(require 'cl)

(setq lexical-binding t)

(defun ts/to-string (item)
  (if (numberp item)
	  (number-to-string item)
	item))

(defun ts/+ (a b)
  (if (or (stringp a) (stringp b))
	  (concat (ts/to-string a) (ts/to-string b))
	(+ a b)))

(defun tslog (msg)
  (print (ts/to-string msg)))

(setq TS '((consolelog . #'tslog)
		  (len . #'length)))

(defun tsarray (items)
  (lexical-let ((items items))
	`((get . ,(lambda (index) (nth index items)))
	  (forEach . ,(lambda (mapper)
				 (-each items mapper)))
	  (length . ,(lambda () (length items)))
	  (push .
	   ,(lambda (item)
		 (setq items (append items `(,item)))))
	  (pop .
	   ,(lambda ()
		 (let ((ret (last items)))
		   (setq items (butlast items))
		   ret))))))

(defun do-with-current-buffer (buffer action)
  (with-current-buffer buffer
	(funcall action)))

(cl-defun tsce-test-function-named-arguments (&key foo bar)
  (+ foo bar))
