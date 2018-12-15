(require 'cl)
(require 'ht)
(require 'dash)

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

(setq TS (ht 
		  ('consolelog #'tslog)
		  ('len #'length)))

(defun tsarray (items)
  (lexical-let ((items items))
	(ht
	 ('get (lambda (index) (nth index items)))
	 ('forEach (lambda (mapper)
				 (-each items mapper)))
	 ('length (lambda () (length items)))
	 ('push
	  (lambda (item)
		(setq items (append items `(,item)))))
	 ('pop
	  (lambda ()
		(let ((ret (last items)))
		  (setq items (butlast items))
		  ret))))))

(defun do-with-current-buffer (buffer action)
  (with-current-buffer buffer
	(funcall action)))

 (cl-defun main ()
    (block block87531-main
        (let ((dart-path "c:/tools/dart-sdk/bin/dart.exe"))
            (let ((snap-shot-path "c:/tools/dart-sdk/bin/snapshots/analysis_server.dart.snapshot"))
                (let ((process (start-process  "dart analyzer" "dartanalyzer" dart-path snap-shot-path)))
                    (set-process-filter  process (lambda ( proc msg)
        (block block54360-lambda
            (message  (ts/+ "We got some msg: " msg))
        )
))
                )
            )
        )
    )
	)
